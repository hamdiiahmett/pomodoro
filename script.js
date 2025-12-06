const app = {
    init: () => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        planner.render();
        stats.calculate();
        timer.update();
        titles.check(); 
    },

    toggleTheme: () => {
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    },

    router: (view) => {
        document.querySelectorAll('section').forEach(el => el.classList.add('hidden'));
        document.getElementById(`view-${view}`).classList.remove('hidden');
        
        if(view === 'stats') stats.render();
        if(view === 'planner') planner.render();
        if(view === 'titles') titles.renderList(); // Unvanlar sayfasına özel
    },

    showToast: (msg) => {
        const t = document.getElementById('toast');
        t.innerText = msg;
        t.className = 'show';
        setTimeout(() => t.className = '', 3000);
    }
};

const titles = {
    ranks: [
        { level: 0, name: "Baboli Mugo Pro", req: "Başlangıç Seviyesi", icon: "🌱" },
        { level: 1, name: "Bebe Domates 👶", req: "1 Günde 15 Domates", icon: "👶" },
        { level: 2, name: "Domates Abi 😎", req: "1 Haftada 60 Domates", icon: "😎" },
        { level: 3, name: "DOMATES 🍅", req: "1 Haftada 110 Domates", icon: "🍅" },
        { level: 4, name: "DOMATES BABA 👑", req: "3 Hafta Üst Üste 110", icon: "👑" }
    ],

    check: () => {
        const DOMATO_SEC = 30 * 60; 
        
        const todaySec = stats.getTodaySeconds();
        const thisWeekSec = stats.getWeekSeconds(0);
        const lastWeekSec = stats.getWeekSeconds(1);
        const twoWeeksAgoSec = stats.getWeekSeconds(2);

        const todayTomatoes = Math.floor(todaySec / DOMATO_SEC);
        const weekTomatoes = Math.floor(thisWeekSec / DOMATO_SEC);
        const lastWeekTomatoes = Math.floor(lastWeekSec / DOMATO_SEC);
        const twoWeeksAgoTomatoes = Math.floor(twoWeeksAgoSec / DOMATO_SEC);

        let earnedLevel = 0;

        if (weekTomatoes >= 110 && lastWeekTomatoes >= 110 && twoWeeksAgoTomatoes >= 110) {
            earnedLevel = 4;
        } else if (weekTomatoes >= 110) {
            earnedLevel = 3;
        } else if (weekTomatoes >= 60) {
            earnedLevel = 2;
        } else if (todayTomatoes >= 15) {
            earnedLevel = 1;
        }

        const savedLevel = parseInt(localStorage.getItem('titleLevel')) || 0;

        if (earnedLevel > savedLevel) {
            localStorage.setItem('titleLevel', earnedLevel);
            const newTitle = titles.ranks.find(r => r.level === earnedLevel).name;
            app.showToast(`🏆 TEBRİKLER! Yeni Ünvan: ${newTitle}`);
            titles.display();
        } else {
            titles.display();
        }
    },

    display: () => {
        const lvl = parseInt(localStorage.getItem('titleLevel')) || 0;
        const rankObj = titles.ranks.find(r => r.level === lvl) || titles.ranks[0];
        const el = document.getElementById('userTitle');
        if(el) el.innerText = rankObj.name;
    },

    renderList: () => {
        const container = document.getElementById('titlesListContainer');
        container.innerHTML = '';
        const currentLevel = parseInt(localStorage.getItem('titleLevel')) || 0;

        titles.ranks.forEach(rank => {
            const isUnlocked = rank.level <= currentLevel;
            const cardClass = isUnlocked ? 'title-card unlocked' : 'title-card';
            const iconDisplay = isUnlocked ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-lock"></i>';

            const html = `
                <div class="${cardClass}">
                    <div class="title-info">
                        <h4>${rank.icon} ${rank.name}</h4>
                        <p>${rank.req}</p>
                    </div>
                    <div class="title-icon">
                        ${iconDisplay}
                    </div>
                </div>
            `;
            container.innerHTML += html;
        });
    }
};

const timer = {
    duration: 30 * 60,
    timeLeft: 30 * 60,
    interval: null,
    isRunning: false,

    setMode: (minutes) => {
        if(timer.isRunning) return; 
        timer.duration = minutes * 60;
        timer.timeLeft = timer.duration;
        timer.update();
        
        document.querySelectorAll('.time-presets button').forEach(btn => btn.classList.remove('active-preset'));
        const clickedBtn = Array.from(document.querySelectorAll('.time-presets button')).find(b => b.innerText.includes(minutes));
        if(clickedBtn) clickedBtn.classList.add('active-preset');
    },

    setCustom: () => {
        if(timer.isRunning) return;
        const val = document.getElementById('customMin').value;
        if(val && val >= 5) {
            timer.setMode(parseInt(val));
            app.showToast(`${val} dakikaya ayarlandı`);
        } else {
            app.showToast("En az 5 dakika olmalı!");
        }
    },

    update: () => {
        const m = Math.floor(timer.timeLeft / 60).toString().padStart(2,'0');
        const s = (timer.timeLeft % 60).toString().padStart(2,'0');
        document.getElementById('timerDisplay').innerText = `${m}:${s}`;
        document.title = `${m}:${s} - Pomodomates`;
    },

    start: () => {
        if(timer.isRunning) return;
        timer.isRunning = true;
        document.getElementById('btnStart').classList.add('hidden');
        document.getElementById('btnPause').classList.remove('hidden');
        
        timer.interval = setInterval(() => {
            timer.timeLeft--;
            timer.update();
            if(timer.timeLeft <= 0) timer.finish();
        }, 1000);
    },

    pause: () => {
        clearInterval(timer.interval);
        timer.isRunning = false;
        document.getElementById('btnStart').innerText = "Devam";
        document.getElementById('btnStart').classList.remove('hidden');
        document.getElementById('btnPause').classList.add('hidden');
    },

    finish: () => {
        clearInterval(timer.interval);
        
        const alarm = document.getElementById('alarmSound');
        alarm.play().catch(e => console.log("Ses hatası:", e));

        const elapsed = timer.duration - timer.timeLeft;
        
        if(elapsed > 60) {
            stats.save(elapsed);
            titles.check();
        }
        
        timer.timeLeft = timer.duration;
        timer.isRunning = false;
        timer.update();
        document.getElementById('btnStart').innerText = "Başla";
        document.getElementById('btnStart').classList.remove('hidden');
        document.getElementById('btnPause').classList.add('hidden');
        document.title = "Bitti! - Pomodomates";
    }
};

const planner = {
    days: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'],
    render: () => {
        const container = document.getElementById('plannerContainer');
        container.innerHTML = '';
        const data = JSON.parse(localStorage.getItem('plans')) || {};
        
        planner.days.forEach(day => {
            const div = document.createElement('div');
            div.className = 'planner-day';
            div.innerHTML = `<h4>${day}</h4><textarea id="p-${day}" placeholder="Hedefin ne?">${data[day]||''}</textarea>`;
            container.appendChild(div);
        });
    },
    save: () => {
        const data = {};
        planner.days.forEach(d => {
            data[d] = document.getElementById(`p-${d}`).value;
        });
        localStorage.setItem('plans', JSON.stringify(data));
        app.showToast('Planlar Kaydedildi');
    },
    clearAll: () => {
        if(confirm('Tüm haftalık planı silmek istiyor musun?')) {
            localStorage.removeItem('plans');
            planner.render();
        }
    }
};

const stats = {
    save: (sec) => {
        const date = new Date().toISOString().split('T')[0];
        let hist = JSON.parse(localStorage.getItem('history')) || {};
        if(!hist[date]) hist[date] = 0;
        hist[date] += sec;
        localStorage.setItem('history', JSON.stringify(hist));
    },

    getWeekSeconds: (offset = 0) => {
        const hist = JSON.parse(localStorage.getItem('history')) || {};
        let curr = new Date();
        let day = curr.getDay(); 
        const diff = curr.getDate() - day + (day === 0 ? -6 : 1) - (offset * 7); 
        const monday = new Date(curr.setDate(diff));

        let total = 0;
        for(let i=0; i<7; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            const dateKey = d.toISOString().split('T')[0];
            total += (hist[dateKey] || 0);
        }
        return total;
    },

    getTodaySeconds: () => {
        const hist = JSON.parse(localStorage.getItem('history')) || {};
        const today = new Date().toISOString().split('T')[0];
        return hist[today] || 0;
    },
    
    calculate: () => {}, 
    
    render: () => {
        const todaySec = stats.getTodaySeconds();
        document.getElementById('statToday').innerText = `${Math.floor(todaySec/60)} dk`;

        const container = document.getElementById('chartContainer');
        container.innerHTML = '';
        
        const hist = JSON.parse(localStorage.getItem('history')) || {};
        let curr = new Date();
        let day = curr.getDay(); 
        const diff = curr.getDate() - day + (day === 0 ? -6 : 1); 
        const monday = new Date(curr.setDate(diff));

        let weekTotal = 0;

        for(let i=0; i<7; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            const dateKey = d.toISOString().split('T')[0];
            const val = hist[dateKey] || 0;
            weekTotal += val;

            const dayName = d.toLocaleDateString('tr-TR', {weekday:'short'});
            
            let h = Math.min((val / 7200) * 100, 100);
            if(val > 0 && h < 10) h = 10; 

            container.innerHTML += `
                <div class="bar-group">
                    <div class="bar" style="height: ${h}%" title="${Math.floor(val/60)} dk"></div>
                    <span class="bar-label">${dayName}</span>
                </div>
            `;
        }
        
        const h = Math.floor(weekTotal/3600);
        const m = Math.floor((weekTotal%3600)/60);
        document.getElementById('statWeekTotal').innerText = `${h}s ${m}dk`;

        const tomatoes = Math.floor(weekTotal / 1800); 
        document.getElementById('tomatoCount').innerText = tomatoes;
    }
};

window.onload = app.init;
