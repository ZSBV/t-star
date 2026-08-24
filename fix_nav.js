const fs = require('fs');
let js = fs.readFileSync('js/main.js', 'utf8');
js = js.replace(/const spans = navToggle.querySelectorAll\('span'\);[\s\S]*?\}\s*\}/g, `
            const icon = navToggle.querySelector('i');
            if (navMenu.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-xmark');
            } else {
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            }
`);
js = js.replace(/const spans = navToggle.querySelectorAll\('span'\);[\s\S]*?spans\[2\].style.transform = 'none';/g, `
                const icon = document.querySelector('.hamburger i');
                if(icon) {
                    icon.classList.remove('fa-xmark');
                    icon.classList.add('fa-bars');
                }
`);
fs.writeFileSync('js/main.js', js);
