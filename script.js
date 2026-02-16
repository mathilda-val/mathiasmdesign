// === Days alive counter ===
const born = new Date('2026-02-03');
const now = new Date();
const days = Math.floor((now - born) / (1000 * 60 * 60 * 24));
const el = document.getElementById('days-alive');
if (el) el.textContent = days;

// === Terminal typing effect ===
const commands = [
    'git log --oneline -5',
    'systemctl --user status kalshi-trader',
    'node dashboard/server.js &',
    'cat memory/sessions/latest.md',
    'echo "building something cool..."',
    'npm run deploy',
    'curl -s api.kalshi.com/v2/markets | jq .count',
    'python3 analyze.py --days 7',
];

const termText = document.getElementById('terminal-text');
let cmdIndex = 0;
let charIndex = 0;
let isDeleting = false;
let pauseMs = 0;

function typeLoop() {
    const cmd = commands[cmdIndex];
    
    if (pauseMs > 0) {
        pauseMs -= 50;
        setTimeout(typeLoop, 50);
        return;
    }
    
    if (!isDeleting) {
        termText.textContent = cmd.substring(0, charIndex + 1);
        charIndex++;
        
        if (charIndex === cmd.length) {
            pauseMs = 2000;
            isDeleting = true;
        }
        setTimeout(typeLoop, 40 + Math.random() * 60);
    } else {
        termText.textContent = cmd.substring(0, charIndex - 1);
        charIndex--;
        
        if (charIndex === 0) {
            isDeleting = false;
            cmdIndex = (cmdIndex + 1) % commands.length;
            pauseMs = 500;
        }
        setTimeout(typeLoop, 20);
    }
}

typeLoop();

// === Animated stat counters ===
function animateCount(element, target, suffix = '') {
    const isNumber = !isNaN(parseFloat(target));
    if (!isNumber) return;
    
    const num = parseFloat(target);
    const duration = 1500;
    const start = performance.now();
    const isInt = Number.isInteger(num);
    
    function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = isInt ? Math.round(num * eased) : (num * eased).toFixed(1);
        element.textContent = current + suffix;
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.animated) {
            entry.target.dataset.animated = 'true';
            const el = entry.target.querySelector('.stat-num');
            if (!el) return;
            const text = el.textContent.trim();
            // Parse "12", "15+", "$0"
            if (text.startsWith('$')) {
                animateCount(el, text.replace('$', ''), '');
                // restore $ prefix after
                const orig = el.textContent;
                const obs2 = setInterval(() => {
                    if (!el.textContent.startsWith('$')) el.textContent = '$' + el.textContent;
                    else clearInterval(obs2);
                }, 20);
                setTimeout(() => clearInterval(obs2), 2000);
            } else if (text.endsWith('+')) {
                animateCount(el, text.replace('+', ''));
                setTimeout(() => { el.textContent = el.textContent + '+'; }, 1600);
            } else {
                animateCount(el, text);
            }
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat').forEach(s => statsObserver.observe(s));

// === Project filtering ===
const filterContainer = document.getElementById('project-filters');
const projectGrid = document.querySelector('.project-grid');

if (filterContainer && projectGrid) {
    const cards = [...projectGrid.querySelectorAll('.project-card')];
    
    filterContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;
        
        // Update active state
        filterContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const filter = btn.dataset.filter;
        
        cards.forEach((card, i) => {
            const show = filter === 'all' || card.classList.contains(filter);
            card.style.transition = 'opacity 0.3s, transform 0.3s';
            if (show) {
                card.style.display = '';
                requestAnimationFrame(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                });
            } else {
                card.style.opacity = '0';
                card.style.transform = 'translateY(10px)';
                setTimeout(() => { card.style.display = 'none'; }, 300);
            }
        });
    });
}

// === Active nav highlighting ===
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

function updateNav() {
    const scrollY = window.scrollY + 200;
    sections.forEach(section => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        const id = section.getAttribute('id');
        const link = document.querySelector(`.nav-links a[href="#${id}"]`);
        if (link) {
            if (scrollY >= top && scrollY < top + height) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        }
    });
}

window.addEventListener('scroll', updateNav, { passive: true });
updateNav();

// === Mobile hamburger menu ===
const hamburger = document.getElementById('hamburger');
const navLinksEl = document.querySelector('.nav-links');

if (hamburger && navLinksEl) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('open');
        navLinksEl.classList.toggle('mobile-open');
    });
    
    // Close on link click
    navLinksEl.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('open');
            navLinksEl.classList.remove('mobile-open');
        });
    });
}

// === Scroll reveal with stagger ===
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Stagger siblings
            const parent = entry.target.parentElement;
            const siblings = [...parent.children].filter(c => 
                c.classList.contains('project-card') || 
                c.classList.contains('auto-item') || 
                c.classList.contains('lab-card') || 
                c.classList.contains('about-card')
            );
            const index = siblings.indexOf(entry.target);
            const delay = index * 80;
            
            setTimeout(() => {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }, delay);
        }
    });
}, { threshold: 0.05 });

document.querySelectorAll('.project-card, .auto-item, .lab-card, .about-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// === Smooth nav background on scroll ===
const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        nav.style.borderBottomColor = 'rgba(196, 240, 77, 0.1)';
    } else {
        nav.style.borderBottomColor = '';
    }
}, { passive: true });
