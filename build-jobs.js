const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const SITE_URL = 'https://t-starpromotion.de/karriere';
const COMPANY_NAME = 'T-Star Promotion';
const COMPANY_LEGAL = 'N.R. International Management GmbH';
const COMPANY_LOGO = 'https://t-starpromotion.de/wp-content/uploads/2025/06/logo.png';
const COMPANY_URL = 'https://t-starpromotion.de';
const JOBS_DIR = path.join(__dirname, 'jobs');
const TEMPLATE_PATH = path.join(__dirname, 'job-template.html');
const DB_PATH = path.join(__dirname, 'jobs-db.json');

// Imports
const jobsData = require('./data/jobs');
const citiesData = require('./data/cities');

// Synonyms
const TITLE_SYNONYMS = {
  'Handelsvertreter Glasfaser & Energie (m/w/d)': [
    'Vertriebspartner Glasfaser & Energie (m/w/d)',
    'Sales Representative Energie (m/w/d)',
    'Außendienstmitarbeiter Glasfaser (m/w/d)'
  ],
  'Quereinsteiger im Vertrieb (m/w/d)': [
    'Vertriebsmitarbeiter ohne Vorkenntnisse (m/w/d)',
    'Neueinsteiger im Außendienst (m/w/d)',
    'Trainee Vertrieb (m/w/d)'
  ],
  'Außendienstmitarbeiter Energie (m/w/d)': [
    'Energieberater im Außendienst (m/w/d)',
    'Vertriebsmitarbeiter Strom & Gas (m/w/d)',
    'Sales Consultant Energie (m/w/d)'
  ],
  'Vertriebsmitarbeiter PV-Leadgenerierung (m/w/d)': [
    'PV-Lead-Generator (m/w/d)',
    'Vertriebsmitarbeiter Photovoltaik (m/w/d)',
    'Solar-Vertriebsmitarbeiter (m/w/d)'
  ],
  'Handelsvertreter Door-to-Door (m/w/d)': [
    'Vertriebspartner im Außendienst (m/w/d)',
    'Handelsvertreter Direktvertrieb (m/w/d)',
    'Selbstständiger Vertriebsberater (m/w/d)'
  ],
  'Glasfaserberater im Außendienst (m/w/d)': [
    'Vertriebsmitarbeiter Glasfaser (m/w/d)',
    'Glasfaser-Handelsvertreter (m/w/d)',
    'Berater Telekommunikation Außendienst (m/w/d)'
  ]
};

// Intros and Outros
const INTROS = [
  'Werde Teil unseres Teams in ${city.name}!',
  'Deine Chance: Neuer Job als ${tmpl.title} in ${city.name}.',
  'Spannende Herausforderung in ${city.name} gesucht? Werde ${tmpl.title}!',
  'Direktstart in ${city.name}: Wir suchen ab sofort ${tmpl.title}.',
  'Dein neuer Job in ${city.name}: Bewirb dich als ${tmpl.title}.',
  'Karriere-Check in ${city.name}: Wir suchen Verstärkung als ${tmpl.title}.',
  'Lust auf Vertrieb? Starte als ${tmpl.title} in ${city.name}.',
  'Deine Zukunft in ${city.name}: Bewirb dich als ${tmpl.title}.',
  'Neu orientieren in ${city.name}: Wir suchen ${tmpl.title} ab sofort.',
  'T-Star Promotion sucht: ${tmpl.title} für ${city.name}.',
  'Top Job-Chance: Werde JETZT ${tmpl.title} in ${city.name}.',
  'Bereit für was Neues? Wir suchen ${tmpl.title} in ${city.name}.',
  'Verstärke uns in ${city.name} als ${tmpl.title}.',
  'Vertriebskarriere in ${city.name} starten: Wir suchen dich als ${tmpl.title}.',
  'Jetzt bewerben in ${city.name}: Deine Chance als ${tmpl.title}.'
];

const OUTROS = [
  'Wir freuen uns auf deine Bewerbung für den Standort ${city.name}!',
  'Nutze deine Chance in ${city.name} und bewirb dich noch heute.',
  'Dein neuer Job in ${city.name} ist nur einen Klick entfernt.',
  'Starte jetzt deine Karriere bei T-Star Promotion in ${city.name}.',
  'Werde Teil der T-Star Erfolgsgeschichte in ${city.name}.',
  'Bewirb dich jetzt und sichere dir deinen Platz in ${city.name}.',
  'Wir erwarten dich in ${city.name} – jetzt Kontakt aufnehmen!',
  'Gemeinsam für den Vertrieb in ${city.name}.',
  'Deine Bewerbung für ${city.name} ist bei uns willkommen.',
  'Komm in unser Team in ${city.name}!',
  'T-Star Promotion: Dein Partner für Vertrieb in ${city.name}.',
  'Wir freuen uns darauf, dich in ${city.name} kennenzulernen.',
  'Starte deine Zukunft noch heute in ${city.name}.',
  'Dein Weg zum Erfolg in ${city.name} beginnt hier.',
  'Mach den nächsten Schritt in ${city.name}.'
];

const ANCHOR_TEXT_VARIATIONS = [
  'Weitere Jobs als {title} in {city}',
  '{title} in {city} gesucht',
  'Jetzt als {title} in {city} bewerben',
  'Stellenangebot: {title} in {city}'
];

// Utility functions
function slugify(text) {
  let str = text.replace(/\(m\/w\/d\)/g, '');
  const charMap = {
    'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss',
    'Ä': 'Ae', 'Ö': 'Oe', 'Ü': 'Ue', '&': 'und'
  };
  str = str.replace(/[äöüßÄÖÜ&]/g, match => charMap[match]);
  str = str.toLowerCase();
  str = str.replace(/[^a-z0-9]+/g, '-');
  str = str.replace(/(^-|-$)+/g, '');
  return str.substring(0, 80);
}

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function shuffle(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Data loading/saving for dates
function loadDb() {
  try {
    if (fs.existsSync(DB_PATH)) {
      return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    }
  } catch (e) {
    console.warn('Could not read jobs-db.json, creating new DB.');
  }
  return {};
}

function saveDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

// Generate unique reference number
function generateRef(plz, title) {
  const titlePart = title.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `TSTAR-${plz}-${random}-${titlePart}`;
}

function getFeedHtmlDescription(job) {
  const aufgaben = job.aufgabenList.map(a => `<li>${esc(a)}</li>`).join('');
  const anforderungen = job.anforderungenList.map(a => `<li>${esc(a)}</li>`).join('');
  const vorteile = job.vorteileList.map(a => `<li>${esc(a)}</li>`).join('');
  
  return `
<p><strong>${esc(job.intro)}</strong></p>
<p>${esc(job.localContext)}</p>
<p>${job.beschreibung}</p>
<h3>Deine Aufgaben:</h3>
<ul>${aufgaben}</ul>
<h3>Dein Profil:</h3>
<ul>${anforderungen}</ul>
<h3>Was wir bieten:</h3>
<ul>${vorteile}</ul>
<p>${esc(job.outro)}</p>
<p><em>Dieses Stellenangebot wird vermittelt durch T-Star Promotion – Vertrieb mit System für Glasfaser, Strom, Gas & PV-Leads. Wir vermitteln selbständige Vertriebspositionen mit intensiver Schulung und Top-Provisionen.</em></p>
  `.trim();
}

// Main generation function
function generateAllJobs(templateStr) {
  const db = loadDb();
  const allGeneratedJobs = [];
  const now = new Date();
  
  citiesData.forEach(city => {
    // Generate jobs for this city
    const cityJobs = [];
    
    jobsData.forEach(tmpl => {
      // Title logic
      let usedTitle = tmpl.title;
      if (TITLE_SYNONYMS[tmpl.title] && TITLE_SYNONYMS[tmpl.title].length > 0) {
        const options = [tmpl.title, ...TITLE_SYNONYMS[tmpl.title]];
        usedTitle = options[Math.floor(Math.random() * options.length)];
      }
      
      const slug = slugify(`${usedTitle} ${city.name}`);
      const jobUrl = `${SITE_URL}/jobs/${slug}.html`;
      
      // DB check for datePosted
      let datePosted = now;
      if (db[slug]) {
        const dbDate = new Date(db[slug].datePosted);
        const daysDiff = (now - dbDate) / (1000 * 60 * 60 * 24);
        if (daysDiff < 30) {
          datePosted = dbDate;
        }
      }
      db[slug] = { datePosted: formatDate(datePosted) };
      
      const validThrough = new Date(datePosted);
      validThrough.setDate(validThrough.getDate() + 60);
      
      const refNumber = generateRef(city.plz, usedTitle);
      
      // Shuffle lists
      const aufgabenList = shuffle(tmpl.aufgaben.split(';').map(s => s.trim()).filter(Boolean));
      const anforderungenList = shuffle(tmpl.anforderungen.split(';').map(s => s.trim()).filter(Boolean));
      const vorteileList = shuffle(tmpl.vorteile.split(';').map(s => s.trim()).filter(Boolean));
      
      // Contexts
      const contexts = tmpl.localContexts || [];
      const localContext = contexts.length > 0 
        ? contexts[Math.floor(Math.random() * contexts.length)].replace(/\$\{city\}/g, city.name)
        : '';
        
      // Intro / Outro
      const introRaw = INTROS[Math.floor(Math.random() * INTROS.length)];
      const intro = introRaw.replace(/\$\{city\.name\}/g, city.name).replace(/\$\{tmpl\.title\}/g, usedTitle);
      
      const outroRaw = OUTROS[Math.floor(Math.random() * OUTROS.length)];
      const outro = outroRaw.replace(/\$\{city\.name\}/g, city.name);
      
      // JSON-LD
      const jsonLd = {
        "@context": "https://schema.org/",
        "@type": "JobPosting",
        "title": tmpl.title,
        "description": getFeedHtmlDescription({ intro, localContext, beschreibung: tmpl.beschreibung, aufgabenList, anforderungenList, vorteileList, outro }),
        "identifier": {
          "@type": "PropertyValue",
          "name": COMPANY_NAME,
          "value": slug
        },
        "datePosted": formatDate(datePosted),
        "validThrough": formatDate(validThrough),
        "employmentType": "CONTRACTOR",
        "hiringOrganization": {
          "@type": "Organization",
          "name": COMPANY_NAME,
          "sameAs": COMPANY_URL,
          "logo": COMPANY_LOGO
        },
        "jobLocation": {
          "@type": "Place",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": city.name,
            "addressRegion": city.region,
            "postalCode": city.plz,
            "addressCountry": "DE"
          }
        },
        "baseSalary": {
          "@type": "MonetaryAmount",
          "currency": "EUR",
          "value": {
            "@type": "QuantitativeValue",
            "minValue": tmpl.salaryMin,
            "maxValue": tmpl.salaryMax,
            "unitText": "MONTH"
          }
        },
        "directApply": true,
        "industry": "Vertrieb & Direktmarketing",
        "jobBenefits": "Überdurchschnittliche Provisionen, Flexible Arbeitszeiten, Intensive Schulung, Karrieremöglichkeiten"
      };

      // User requested ONLY human interaction / door-to-door images for ALL jobs, no fiber optic cables or solar panels
      const variants = ['images/jobs/beratung.jpg', 'images/jobs/beratung-mann.jpg', 'images/jobs/beratung-frau.jpg', 'images/jobs/beratung-team.jpg'];
      let jobImage = variants[Math.floor(Math.random() * variants.length)];

      const jobData = {
        title: usedTitle,
        originalTitle: tmpl.title,
        city: city,
        slug,
        jobUrl,
        datePosted,
        validThrough,
        refNumber,
        aufgabenList,
        anforderungenList,
        vorteileList,
        localContext,
        intro,
        outro,
        beschreibung: tmpl.beschreibung,
        salaryMin: tmpl.salaryMin,
        salaryMax: tmpl.salaryMax,
        badge: tmpl.badge,
        badgeClass: tmpl.badgeClass,
        image: jobImage,
        seoDescription: tmpl.seoDescription.replace(/\{\{LOCATION\}\}/g, city.name),
        jsonLd,
        htmlDescription: getFeedHtmlDescription({ intro, localContext, beschreibung: tmpl.beschreibung, aufgabenList, anforderungenList, vorteileList, outro })
      };
      
      cityJobs.push(jobData);
      allGeneratedJobs.push(jobData);
    });
    
    // Internal links generation for each job in this city
    cityJobs.forEach(job => {
      const otherJobs = cityJobs.filter(j => j.slug !== job.slug);
      const linksCount = Math.min(3, otherJobs.length);
      const randomOthers = shuffle(otherJobs).slice(0, linksCount);
      
      let internalLinksHtml = '';
      if (randomOthers.length > 0) {
        internalLinksHtml += `<div style="margin-top:48px; background:rgba(240,103,35,0.05); border:1px solid rgba(240,103,35,0.2); border-radius:16px; padding:32px;">`;
        internalLinksHtml += `<h2>🔍 Weitere Jobs in ${esc(city.name)}</h2>`;
        internalLinksHtml += `<ul style="list-style:none; padding:0;">`;
        randomOthers.forEach(other => {
          const anchorTmpl = ANCHOR_TEXT_VARIATIONS[Math.floor(Math.random() * ANCHOR_TEXT_VARIATIONS.length)];
          const anchorText = anchorTmpl.replace(/\{title\}/g, other.title).replace(/\{city\}/g, city.name);
          internalLinksHtml += `<li style="margin-bottom:12px;"><a href="${other.slug}.html" style="color:#F06723; text-decoration:none;">→ ${esc(anchorText)}</a></li>`;
        });
        internalLinksHtml += `</ul></div>`;
      }
      job.internalLinks = internalLinksHtml;
    });
  });
  
  saveDb(db);
  
  // HTML Generation
  allGeneratedJobs.forEach(job => {
    const listToHtml = list => list.map(item => `<li>${esc(item)}</li>`).join('');
    let html = templateStr
      .replace(/\{\{TITLE\}\}/g, esc(job.title))
      .replace(/\{\{LOCATION\}\}/g, esc(job.city.name))
      .replace(/\{\{SALARY\}\}/g, `${job.salaryMin} - ${job.salaryMax}`)
      .replace(/\{\{SALARY_MIN\}\}/g, job.salaryMin)
      .replace(/\{\{SALARY_MAX\}\}/g, job.salaryMax)
      .replace(/\{\{DATE_POSTED\}\}/g, formatDate(job.datePosted))
      .replace(/\{\{EMPLOYMENT\}\}/g, "Selbständig / Freiberuflich")
      .replace(/\{\{DESCRIPTION\}\}/g, job.beschreibung)
      .replace(/\{\{INTRO\}\}/g, esc(job.intro))
      .replace(/\{\{LOCAL_CONTEXT\}\}/g, esc(job.localContext))
      .replace(/\{\{TASKS_LIST\}\}/g, listToHtml(job.aufgabenList))
      .replace(/\{\{REQUIREMENTS_LIST\}\}/g, listToHtml(job.anforderungenList))
      .replace(/\{\{BENEFITS_LIST\}\}/g, listToHtml(job.vorteileList))
      .replace(/\{\{BADGE\}\}/g, esc(job.badge))
      .replace(/\{\{BADGE_CLASS\}\}/g, esc(job.badgeClass))
      .replace(/\{\{JSON_LD\}\}/g, JSON.stringify(job.jsonLd, null, 2))
      .replace(/\{\{META_DESCRIPTION\}\}/g, esc(job.seoDescription))
      .replace(/\{\{INTERNAL_LINKS\}\}/g, job.internalLinks)
      .replace(/\{\{JOB_URL\}\}/g, job.jobUrl)
      .replace(/\{\{IMAGE_PATH\}\}/g, esc(job.image));
      
    fs.writeFileSync(path.join(JOBS_DIR, `${job.slug}.html`), html, 'utf-8');
  });
  
  return allGeneratedJobs;
}

// Feeds
function generateSitemap(jobs) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/alle-jobs.html</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;
  
  jobs.forEach(job => {
    xml += `
  <url>
    <loc>${job.jobUrl}</loc>
    <lastmod>${formatDate(job.datePosted)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  });
  
  xml += `\n</urlset>`;
  fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), xml, 'utf-8');
}

function generateHtmlSitemap(jobs) {
  // Group by city
  const cityMap = {};
  jobs.forEach(job => {
    if (!cityMap[job.city.name]) cityMap[job.city.name] = [];
    cityMap[job.city.name].push(job);
  });
  
  const sortedCities = Object.keys(cityMap).sort();
  
  let html = `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Alle Jobs - ${COMPANY_NAME}</title>
    <meta name="description" content="Entdecke alle offenen Stellen bei ${COMPANY_NAME} in Bremen, NRW und ganz Deutschland.">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="css/style.css">
    <script src="js/main.js" defer></script>
    <style>
      body { background-color: var(--gray-bg); padding-top: 80px; }
      .sitemap-header { background: linear-gradient(135deg, rgba(17,17,17,0.95), rgba(17,17,17,0.9)), url('images/office-interior.jpg'); background-size: cover; background-position: center; padding: 60px 0; text-align: center; color: white; margin-bottom: 40px; }
      .sitemap-header h1 { color: var(--light); font-size: 42px; margin-bottom: 10px; }
      .sitemap-header p { color: var(--primary); font-size: 18px; font-weight: 600; }
      .city-group { margin-bottom: 50px; }
      .city-title { color: var(--dark); border-bottom: 3px solid var(--primary); padding-bottom: 10px; margin-bottom: 25px; display: inline-block; font-size: 28px; }
      .job-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
      .job-card { background: var(--light); padding: 25px; border-radius: 12px; box-shadow: var(--shadow-sm); border-top: 4px solid var(--primary); transition: var(--transition); display: flex; flex-direction: column; }
      .job-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-md); }
      .job-card h3 { font-size: 18px; color: var(--dark); margin-bottom: 15px; }
      .job-card a { color: var(--dark); text-decoration: none; display: block; }
      .job-card a:hover h3 { color: var(--primary); }
      .job-meta { font-size: 14px; color: var(--text-light); display: flex; gap: 15px; margin-bottom: 20px; }
      .job-meta i { color: var(--primary); width: 16px; }
      .btn-outline { align-self: flex-start; margin-top: auto; padding: 8px 20px; font-size: 14px; }
      .search-container { max-width: 600px; margin: 0 auto 40px; position: relative; }
      .search-input { width: 100%; padding: 15px 20px 15px 50px; font-size: 16px; border: 2px solid var(--primary); border-radius: 30px; outline: none; transition: box-shadow 0.3s; }
      .search-input:focus { box-shadow: 0 0 15px rgba(240, 103, 35, 0.3); }
      .search-icon { position: absolute; left: 20px; top: 50%; transform: translateY(-50%); color: var(--primary); font-size: 18px; }
      .no-results { display: none; text-align: center; padding: 40px; font-size: 18px; color: var(--text-light); }
    </style>
</head>
<body>
    <header class="site-header">
        <div class="container header-container">
            <a href="../index.html" class="logo-link">
                <img src="${COMPANY_LOGO}" alt="${COMPANY_NAME} Logo" style="width: 160px; max-width: 100%;">
            </a>
            <nav class="main-nav">
                <ul class="nav-links">
                    <li><a href="../index.html#hero">Home</a></li>
                    <li><a href="../index.html#jobs">Offene Stellen</a></li>
                    <li><a href="../index.html#vorteile">Vorteile</a></li>
                    <li><a href="../index.html#leistungen">Leistungen</a></li>
                    <li><a href="../index.html#bewerben">Bewerben</a></li>
                    <li><a href="../index.html#kontakt">Kontakt</a></li>
                </ul>
            </nav>
            <div class="hamburger">
                <i class="fa-solid fa-bars"></i>
            </div>
        </div>
    </header>

    <div class="sitemap-header">
        <div class="container">
            <h1>Alle Stellenangebote</h1>
            <p>${COMPANY_NAME}</p>
        </div>
    </div>
    
    <div class="container">
        <div class="search-container">
            <i class="fa-solid fa-search search-icon"></i>
            <input type="text" id="job-search" class="search-input" placeholder="Nach Postleitzahl oder Stadt suchen...">
        </div>
        <div id="no-results" class="no-results">Keine Jobs für diese Suche gefunden.</div>
        <div id="jobs-container">`;
        
  sortedCities.forEach(city => {
    const plz = cityMap[city][0].city.plz;
    html += `
        <div class="city-group" data-plz="${plz}" data-city="${esc(city).toLowerCase()}">
            <h2 class="city-title">Jobs in ${esc(city)} <span style="font-size:16px; color:#666; font-weight:400;">(PLZ: ${plz})</span></h2>
            <div class="job-grid">`;
    cityMap[city].forEach(job => {
      html += `
                <div class="job-card">
                    <a href="jobs/${job.slug}.html">
                        <h3>${esc(job.title)}</h3>
                    </a>
                    <div class="job-meta">
                        <span><i class="fa-solid fa-map-pin"></i> ${esc(city)}</span>
                        <span><i class="fa-solid fa-euro-sign"></i> ${job.salaryMin} - ${job.salaryMax} €</span>
                    </div>
                    <a href="jobs/${job.slug}.html" class="btn btn-outline">Details ansehen</a>
                </div>`;
    });
    html += `
            </div>
        </div>`;
  });
  html += `
    </div>
    </div>
    
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const searchInput = document.getElementById('job-search');
            const cityGroups = document.querySelectorAll('.city-group');
            const noResults = document.getElementById('no-results');

            function filterJobs(term) {
                term = term.toLowerCase().trim();
                let visibleCount = 0;

                cityGroups.forEach(group => {
                    const plz = group.getAttribute('data-plz');
                    const city = group.getAttribute('data-city');
                    
                    if (plz.includes(term) || city.includes(term)) {
                        group.style.display = 'block';
                        visibleCount++;
                    } else {
                        group.style.display = 'none';
                    }
                });

                if (visibleCount === 0) {
                    noResults.style.display = 'block';
                } else {
                    noResults.style.display = 'none';
                }
            }

            // Listen for typing
            searchInput.addEventListener('input', function(e) {
                filterJobs(e.target.value);
            });

            // Check URL parameters for automatic filtering
            const urlParams = new URLSearchParams(window.location.search);
            const ortParam = urlParams.get('ort');
            if (ortParam) {
                searchInput.value = ortParam;
                filterJobs(ortParam);
            }
        });
    </script>
    <footer class="site-footer">
        <div class="container footer-container">
            <div class="footer-logo">
                <img src="${COMPANY_LOGO}" alt="${COMPANY_NAME} Logo" style="width: 160px; max-width: 100%;">
            </div>
            <div class="footer-links">
                <a href="impressum.html">Impressum</a>
                <a href="datenschutz.html">Datenschutz</a>
                <a href="karriere.html">Karriere</a>
            </div>
            <div class="footer-contact">
                <a href="tel:+4915155767740">+49 151 55767740</a> | 
                <a href="mailto:Info@t-starpromotion.de">Info@t-starpromotion.de</a>
            </div>
            <div class="footer-copyright">
                &copy; 2025 ${COMPANY_NAME} | ${COMPANY_LEGAL}. Alle Rechte vorbehalten.
            </div>
        </div>
    </footer>
</body>
</html>`;
  fs.writeFileSync(path.join(__dirname, 'alle-jobs.html'), html, 'utf-8');
}

function generateJoobleFeed(jobs) {
  let xml = `<?xml version="1.0" encoding="utf-8"?>\n<jobs>`;
  jobs.forEach(job => {
    xml += `
  <job id="${job.refNumber}">
    <link><![CDATA[${job.jobUrl}?utm_source=jooble]]></link>
    <name><![CDATA[${job.title}]]></name>
    <region><![CDATA[${job.city.name}]]></region>
    <description><![CDATA[${job.htmlDescription}]]></description>
    <pubdate>${formatDate(job.datePosted)}</pubdate>
    <updated>${formatDate(job.datePosted)}</updated>
    <salary><![CDATA[${job.salaryMin} - ${job.salaryMax} EUR / Monat]]></salary>
    <company><![CDATA[${COMPANY_NAME}]]></company>
    <company_logo><![CDATA[${COMPANY_LOGO}]]></company_logo>
    <email><![CDATA[Info@t-starpromotion.de]]></email>
    <postalcode>${job.city.plz}</postalcode>
    <expire>${formatDate(job.validThrough)}</expire>
    <jobtype><![CDATA[CONTRACTOR]]></jobtype>
  </job>`;
  });
  xml += `\n</jobs>`;
  fs.writeFileSync(path.join(__dirname, 'jooble-feed.xml'), xml, 'utf-8');
}

function generateIndeedFeed(jobs) {
  let xml = `<?xml version="1.0" encoding="utf-8"?>\n<source>\n  <publisher>${COMPANY_NAME}</publisher>\n  <publisherurl>${COMPANY_URL}</publisherurl>\n  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`;
  jobs.forEach(job => {
    xml += `
  <job>
    <title><![CDATA[${job.title}]]></title>
    <date><![CDATA[${formatDate(job.datePosted)}]]></date>
    <referencenumber><![CDATA[${job.refNumber}]]></referencenumber>
    <url><![CDATA[${job.jobUrl}?utm_source=indeed]]></url>
    <company><![CDATA[${COMPANY_NAME}]]></company>
    <city><![CDATA[${job.city.name}]]></city>
    <state><![CDATA[${job.city.region}]]></state>
    <country><![CDATA[DE]]></country>
    <description><![CDATA[${job.htmlDescription}]]></description>
    <salary><![CDATA[${job.salaryMin} - ${job.salaryMax} EUR per month]]></salary>
    <jobtype><![CDATA[contract]]></jobtype>
    <expirationdate><![CDATA[${formatDate(job.validThrough)}]]></expirationdate>
  </job>`;
  });
  xml += `\n</source>`;
  fs.writeFileSync(path.join(__dirname, 'indeed-feed.xml'), xml, 'utf-8');
}

function generateTalentFeed(jobs) {
  let xml = `<?xml version="1.0" encoding="utf-8"?>\n<source>\n  <publisher>${COMPANY_NAME}</publisher>\n  <publisherurl>${COMPANY_URL}</publisherurl>`;
  jobs.forEach(job => {
    xml += `
  <job>
    <title><![CDATA[${job.title}]]></title>
    <company><![CDATA[${COMPANY_NAME}]]></company>
    <city><![CDATA[${job.city.name}]]></city>
    <state><![CDATA[${job.city.region}]]></state>
    <country><![CDATA[DE]]></country>
    <dateposted><![CDATA[${formatDate(job.datePosted)}]]></dateposted>
    <expirationdate><![CDATA[${formatDate(job.validThrough)}]]></expirationdate>
    <referencenumber><![CDATA[${job.refNumber}]]></referencenumber>
    <url><![CDATA[${job.jobUrl}?utm_source=talent]]></url>
    <description><![CDATA[${job.htmlDescription}]]></description>
    <salary>
      <min>${job.salaryMin}</min>
      <max>${job.salaryMax}</max>
      <currency>EUR</currency>
      <period>monthly</period>
      <type>base</type>
    </salary>
    <jobtype><![CDATA[contract]]></jobtype>
  </job>`;
  });
  xml += `\n</source>`;
  fs.writeFileSync(path.join(__dirname, 'talent-feed.xml'), xml, 'utf-8');
}

function generateAdzunaFeed(jobs) {
  let xml = `<?xml version="1.0" encoding="utf-8"?>\n<source>\n  <publisher>${COMPANY_NAME}</publisher>\n  <publisherurl>${COMPANY_URL}</publisherurl>`;
  jobs.forEach(job => {
    xml += `
  <job>
    <title><![CDATA[${job.title}]]></title>
    <company><![CDATA[${COMPANY_NAME}]]></company>
    <city><![CDATA[${job.city.name}]]></city>
    <state><![CDATA[${job.city.region}]]></state>
    <country><![CDATA[DE]]></country>
    <postalcode><![CDATA[${job.city.plz}]]></postalcode>
    <dateposted><![CDATA[${formatDate(job.datePosted)}]]></dateposted>
    <expirationdate><![CDATA[${formatDate(job.validThrough)}]]></expirationdate>
    <referencenumber><![CDATA[${job.refNumber}]]></referencenumber>
    <url><![CDATA[${job.jobUrl}?utm_source=adzuna]]></url>
    <description><![CDATA[${job.htmlDescription}]]></description>
    <salary>
      <min>${job.salaryMin}</min>
      <max>${job.salaryMax}</max>
      <currency>EUR</currency>
      <period>monthly</period>
      <type>base</type>
    </salary>
    <jobtype><![CDATA[contract]]></jobtype>
  </job>`;
  });
  xml += `\n</source>`;
  fs.writeFileSync(path.join(__dirname, 'adzuna-feed.xml'), xml, 'utf-8');
}

function generateCareerjetFeed(jobs) {
  let xml = `<?xml version="1.0" encoding="utf-8"?>\n<source>\n  <publisher>${COMPANY_NAME}</publisher>\n  <publisherurl>${COMPANY_URL}</publisherurl>`;
  jobs.forEach(job => {
    xml += `
  <job>
    <title><![CDATA[${job.title}]]></title>
    <company><![CDATA[${COMPANY_NAME}]]></company>
    <city><![CDATA[${job.city.name}]]></city>
    <state><![CDATA[${job.city.region}]]></state>
    <country><![CDATA[DE]]></country>
    <postalcode><![CDATA[${job.city.plz}]]></postalcode>
    <dateposted><![CDATA[${formatDate(job.datePosted)}]]></dateposted>
    <expirationdate><![CDATA[${formatDate(job.validThrough)}]]></expirationdate>
    <referencenumber><![CDATA[${job.refNumber}]]></referencenumber>
    <url><![CDATA[${job.jobUrl}?utm_source=careerjet]]></url>
    <description><![CDATA[${job.htmlDescription}]]></description>
    <salary>
      <min>${job.salaryMin}</min>
      <max>${job.salaryMax}</max>
      <currency>EUR</currency>
      <period>monthly</period>
      <type>base</type>
    </salary>
    <jobtype><![CDATA[contract]]></jobtype>
  </job>`;
  });
  xml += `\n</source>`;
  fs.writeFileSync(path.join(__dirname, 'careerjet-feed.xml'), xml, 'utf-8');
}

function generateKimetaFeed(jobs) {
  let xml = `<?xml version="1.0" encoding="utf-8"?>\n<stellenanzeigen>`;
  jobs.forEach(job => {
    xml += `
  <stellenanzeige>
    <daten>
      <position><![CDATA[${job.title}]]></position>
      <inhalt><![CDATA[${job.htmlDescription}]]></inhalt>
      <institution><![CDATA[${COMPANY_NAME}]]></institution>
      <link-anzeige><![CDATA[${job.jobUrl}?utm_source=kimeta]]></link-anzeige>
      <arbeitsorte>
        <arbeitsort>
          <plz><![CDATA[${job.city.plz}]]></plz>
          <ort><![CDATA[${job.city.name}]]></ort>
          <bundesland><![CDATA[${job.city.region}]]></bundesland>
          <land><![CDATA[DE]]></land>
        </arbeitsort>
      </arbeitsorte>
      <beschaeftigungsart><![CDATA[contract]]></beschaeftigungsart>
      <zeitintensitaet><![CDATA[vollzeit]]></zeitintensitaet>
    </daten>
    <buchung>
      <anzeigennummer><![CDATA[${job.refNumber}]]></anzeigennummer>
      <produktbezeichnung><![CDATA[standard]]></produktbezeichnung>
      <startdatum><![CDATA[${formatDate(job.datePosted)}]]></startdatum>
      <enddatum><![CDATA[${formatDate(job.validThrough)}]]></enddatum>
    </buchung>
  </stellenanzeige>`;
  });
  xml += `\n</stellenanzeigen>`;
  fs.writeFileSync(path.join(__dirname, 'kimeta.xml'), xml, 'utf-8');
}

function generateXingFeed(jobs) {
  let xml = `<?xml version="1.0" encoding="utf-8"?>\n<feed>\n  <postings>`;
  jobs.forEach(job => {
    xml += `
    <posting>
      <id><![CDATA[${job.refNumber}]]></id>
      <job_title><![CDATA[${job.title}]]></job_title>
      <description><![CDATA[${job.htmlDescription}]]></description>
      <url><![CDATA[${job.jobUrl}?utm_source=xing]]></url>
      <company_name><![CDATA[${COMPANY_NAME}]]></company_name>
      <job_locations>
        <job_location>
          <city><![CDATA[${job.city.name}]]></city>
          <zip_code><![CDATA[${job.city.plz}]]></zip_code>
          <country><![CDATA[DE]]></country>
        </job_location>
      </job_locations>
      <salary>
        <range_start><![CDATA[${job.salaryMin}]]></range_start>
        <range_end><![CDATA[${job.salaryMax}]]></range_end>
        <currency><![CDATA[EUR]]></currency>
      </salary>
      <job_type><![CDATA[CONTRACT]]></job_type>
      <reply_setting>LINK</reply_setting>
    </posting>`;
  });
  xml += `\n  </postings>\n</feed>`;
  fs.writeFileSync(path.join(__dirname, 'xing-feed.xml'), xml, 'utf-8');
}

// Build Runner
function build() {
  console.log('--- T-Star Promotion Build Started ---');
  
  // 1. Read template
  let templateStr = '';
  try {
    templateStr = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
  } catch (e) {
    console.error('ERROR: Could not read template file:', TEMPLATE_PATH);
    console.error('Please make sure job-template.html exists.');
    process.exit(1);
  }

  // 2. Log
  const expectedCount = jobsData.length * citiesData.length;
  console.log(`Found \${jobsData.length} Job-Typen x \${citiesData.length} Städte = \${expectedCount} Seiten erwartet`);

  // 3. Create/clean jobs directory
  if (!fs.existsSync(JOBS_DIR)) {
    fs.mkdirSync(JOBS_DIR, { recursive: true });
  } else {
    const files = fs.readdirSync(JOBS_DIR);
    for (const file of files) {
      if (file.endsWith('.html')) {
        fs.unlinkSync(path.join(JOBS_DIR, file));
      }
    }
  }

  // 4. Generate all jobs
  const jobs = generateAllJobs(templateStr);
  
  // 5. HTML files are written during generation.
  console.log(`Successfully generated \${jobs.length} job HTML files.`);

  // 6 - 8. Generate Feeds and Sitemaps
  generateSitemap(jobs);
  console.log('Generated sitemap.xml');
  
  generateHtmlSitemap(jobs);
  console.log('Generated alle-jobs.html');
  
  generateJoobleFeed(jobs);
  console.log('Generated jooble-feed.xml');
  
  generateIndeedFeed(jobs);
  console.log('Generated indeed-feed.xml');
  
  generateTalentFeed(jobs);
  console.log('Generated talent-feed.xml');
  
  generateAdzunaFeed(jobs);
  console.log('Generated adzuna-feed.xml');
  
  generateCareerjetFeed(jobs);
  console.log('Generated careerjet-feed.xml');
  
  generateKimetaFeed(jobs);
  console.log('Generated kimeta.xml');
  
  generateXingFeed(jobs);
  console.log('Generated xing-feed.xml');

  // 9. Log summary
  console.log('--- Build Finished Successfully ---');
}

// Run the build
build();
