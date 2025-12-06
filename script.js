const app = {
    init: () => {
        // Theme Check
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        planner.render();
        stats.calculate();
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
    },

    showToast: (msg) => {
        const t = document.getElementById('toast');
        t.innerText = msg;
        t.className = 'show';
        setTimeout(() => t.className = '', 3000);
    }
};

const timer = {
    duration: 25 * 60,
    timeLeft: 25 * 60,
    interval: null,
    isRunning: false,

    update: () => {
        const m = Math.floor(timer.timeLeft / 60).toString().padStart(2,'0');
        const s = (timer.timeLeft % 60).toString().padStart(2,'0');
        document.getElementById('timerDisplay').innerText = `${m}:${s}`;
        document.title = `${m}:${s} - Çalış Köle`;
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
        const elapsed = timer.duration - timer.timeLeft;
        if(elapsed > 10) {
            stats.save(elapsed);
            app.showToast(`Helal! ${Math.floor(elapsed/60)} dk çalıştın.`);
        }
        timer.timeLeft = timer.duration;
        timer.isRunning = false;
        timer.update();
        document.getElementById('btnStart').innerText = "Başla";
        document.getElementById('btnStart').classList.remove('hidden');
        document.getElementById('btnPause').classList.add('hidden');
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
            div.innerHTML = `<h4>${day}</h4><textarea id="p-${day}" placeholder="Hedef gir...">${data[day]||''}</textarea>`;
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
        if(confirm('Hepsini siliyorum bak?')) {
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
    calculate: () => {}, 
    render: () => {
        const hist = JSON.parse(localStorage.getItem('history')) || {};
        const today = new Date().toISOString().split('T')[0];
        
        // Bugün
        document.getElementById('statToday').innerText = `${Math.floor((hist[today]||0)/60)} dk`;

        // Haftalık Grafik (Pzt - Paz)
        const container = document.getElementById('chartContainer');
        container.innerHTML = '';
        
        // Haftanın başını (Pazartesi) bul
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
    }
};

window.onload = app.init;
