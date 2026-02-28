// ============================================
// Revolution Idle 2 - Game Engine
// ============================================

const game = {
    // --- State ---
    state: {
        followers: 0,
        influence: 0,
        gold: 0,
        knowledge: 0,
        totalFollowers: 0,
        totalInfluence: 0,
        totalGold: 0,
        totalKnowledge: 0,
        totalClicks: 0,
        totalPrestiges: 0,
        era: 0,
        eraMultiplier: 1,
        clickPower: 1,
        followersPerSec: 0,
        influencePerSec: 0,
        goldPerSec: 0,
        knowledgePerSec: 0,
        ownedUpgrades: [],
        buildings: {},
        research: [],
        achievements: [],
        startTime: Date.now(),
        lastSave: Date.now(),
        offlineTime: 0,
    },

    // --- Eras (Prestige Tiers) ---
    eras: [
        { name: 'Ancient', color: '#8B7355' },
        { name: 'Classical', color: '#CD853F' },
        { name: 'Medieval', color: '#708090' },
        { name: 'Renaissance', color: '#DAA520' },
        { name: 'Industrial', color: '#696969' },
        { name: 'Modern', color: '#4682B4' },
        { name: 'Digital', color: '#00CED1' },
        { name: 'Quantum', color: '#9370DB' },
        { name: 'Transcendent', color: '#FF6347' },
    ],

    // --- Upgrades Data ---
    upgradesData: [
        { id: 'megaphone', name: 'Megaphone', desc: 'Double click power', cost: { followers: 25 }, effect: () => { game.state.clickPower *= 2; }, repeatable: false },
        { id: 'propaganda', name: 'Propaganda Leaflets', desc: '+1 follower/s', cost: { followers: 50 }, effect: () => { game.state.followersPerSec += 1; }, repeatable: false },
        { id: 'charisma', name: 'Charismatic Leader', desc: 'Speeches give 3x influence', cost: { influence: 30 }, effect: () => { game._speechMulti = (game._speechMulti || 1) * 3; }, repeatable: false },
        { id: 'marketplace', name: 'Black Market', desc: 'Trading gives 3x gold', cost: { gold: 50 }, effect: () => { game._tradeMulti = (game._tradeMulti || 1) * 3; }, repeatable: false },
        { id: 'library', name: 'Ancient Library', desc: 'Study gives 3x knowledge', cost: { knowledge: 30 }, effect: () => { game._studyMulti = (game._studyMulti || 1) * 3; }, repeatable: false },
        { id: 'printing', name: 'Printing Press', desc: '+5 followers/s, +2 influence/s', cost: { followers: 200, gold: 100 }, effect: () => { game.state.followersPerSec += 5; game.state.influencePerSec += 2; }, repeatable: false },
        { id: 'treasury', name: 'National Treasury', desc: '+5 gold/s', cost: { gold: 500, influence: 100 }, effect: () => { game.state.goldPerSec += 5; }, repeatable: false },
        { id: 'university', name: 'Grand University', desc: '+5 knowledge/s', cost: { knowledge: 200, gold: 300 }, effect: () => { game.state.knowledgePerSec += 5; }, repeatable: false },
        { id: 'rally', name: 'Mass Rally', desc: '5x click power', cost: { followers: 1000, influence: 500 }, effect: () => { game.state.clickPower *= 5; }, repeatable: false },
        { id: 'manifesto', name: 'The Manifesto', desc: 'All production x2', cost: { knowledge: 500, influence: 500, gold: 500 }, effect: () => { game.state.followersPerSec *= 2; game.state.influencePerSec *= 2; game.state.goldPerSec *= 2; game.state.knowledgePerSec *= 2; }, repeatable: false },
        { id: 'spynet', name: 'Spy Network', desc: '+10 influence/s', cost: { gold: 1000, knowledge: 200 }, effect: () => { game.state.influencePerSec += 10; }, repeatable: false },
        { id: 'coup', name: 'Coup Planning', desc: '10x click power', cost: { followers: 5000, influence: 2000, gold: 2000 }, effect: () => { game.state.clickPower *= 10; }, repeatable: false },
    ],

    // --- Buildings Data ---
    buildingsData: [
        { id: 'camp', name: 'Training Camp', desc: '+2 followers/s per camp', baseCost: { followers: 30 }, costScale: 1.15, perSec: { followers: 2 } },
        { id: 'tavern', name: 'Tavern', desc: '+1 influence/s per tavern', baseCost: { followers: 50, gold: 20 }, costScale: 1.18, perSec: { influence: 1 } },
        { id: 'mine', name: 'Gold Mine', desc: '+3 gold/s per mine', baseCost: { gold: 80, followers: 40 }, costScale: 1.2, perSec: { gold: 3 } },
        { id: 'school', name: 'School', desc: '+1 knowledge/s per school', baseCost: { gold: 100, knowledge: 20 }, costScale: 1.2, perSec: { knowledge: 1 } },
        { id: 'fort', name: 'Fortress', desc: '+5 followers/s, +2 influence/s', baseCost: { followers: 200, gold: 150 }, costScale: 1.25, perSec: { followers: 5, influence: 2 } },
        { id: 'bank', name: 'Bank', desc: '+8 gold/s per bank', baseCost: { gold: 500, influence: 50 }, costScale: 1.22, perSec: { gold: 8 } },
        { id: 'academy', name: 'Academy', desc: '+4 knowledge/s per academy', baseCost: { knowledge: 150, gold: 200 }, costScale: 1.25, perSec: { knowledge: 4 } },
        { id: 'palace', name: 'Palace', desc: '+10 all resources/s', baseCost: { followers: 1000, influence: 500, gold: 1000, knowledge: 500 }, costScale: 1.35, perSec: { followers: 10, influence: 10, gold: 10, knowledge: 10 } },
    ],

    // --- Research Data ---
    researchData: [
        { id: 'writing', name: 'Writing', desc: 'Unlock +50% knowledge production', cost: { knowledge: 50 }, effect: () => { game.state.knowledgePerSec *= 1.5; } },
        { id: 'currency', name: 'Currency', desc: 'Unlock +50% gold production', cost: { knowledge: 100, gold: 50 }, effect: () => { game.state.goldPerSec *= 1.5; } },
        { id: 'rhetoric', name: 'Rhetoric', desc: '+100% influence production', cost: { knowledge: 200 }, effect: () => { game.state.influencePerSec *= 2; } },
        { id: 'tactics', name: 'Military Tactics', desc: '+100% follower production', cost: { knowledge: 300, followers: 500 }, effect: () => { game.state.followersPerSec *= 2; } },
        { id: 'banking', name: 'Banking System', desc: 'All buildings cost -20%', cost: { knowledge: 500, gold: 500 }, effect: () => { game._buildDiscount = (game._buildDiscount || 1) * 0.8; } },
        { id: 'philosophy', name: 'Philosophy', desc: 'All production x1.5', cost: { knowledge: 1000 }, effect: () => { game.state.followersPerSec *= 1.5; game.state.influencePerSec *= 1.5; game.state.goldPerSec *= 1.5; game.state.knowledgePerSec *= 1.5; } },
        { id: 'gunpowder', name: 'Gunpowder', desc: '20x click power', cost: { knowledge: 2000, gold: 1000 }, effect: () => { game.state.clickPower *= 20; } },
        { id: 'revolution', name: 'Revolution Theory', desc: 'All production x3', cost: { knowledge: 5000, influence: 3000 }, effect: () => { game.state.followersPerSec *= 3; game.state.influencePerSec *= 3; game.state.goldPerSec *= 3; game.state.knowledgePerSec *= 3; } },
    ],

    // --- Achievements Data ---
    achievementsData: [
        { id: 'first_follower', name: 'First Follower', desc: 'Recruit your first follower', icon: '&#9760;', check: () => game.state.totalFollowers >= 1 },
        { id: 'hundred_followers', name: 'The Hundred', desc: 'Have 100 followers at once', icon: '&#9760;', check: () => game.state.followers >= 100 },
        { id: 'thousand_followers', name: 'The Masses', desc: 'Have 1,000 followers at once', icon: '&#9760;', check: () => game.state.followers >= 1000 },
        { id: 'first_influence', name: 'Voice of the People', desc: 'Gain your first influence', icon: '&#9733;', check: () => game.state.totalInfluence >= 1 },
        { id: 'hundred_influence', name: 'Rising Star', desc: 'Have 100 influence', icon: '&#9733;', check: () => game.state.influence >= 100 },
        { id: 'first_gold', name: 'First Coin', desc: 'Earn your first gold', icon: '&#9672;', check: () => game.state.totalGold >= 1 },
        { id: 'rich', name: 'War Chest', desc: 'Have 1,000 gold', icon: '&#9672;', check: () => game.state.gold >= 1000 },
        { id: 'first_knowledge', name: 'Enlightened', desc: 'Gain your first knowledge', icon: '&#9830;', check: () => game.state.totalKnowledge >= 1 },
        { id: 'scholar', name: 'Scholar', desc: 'Have 500 knowledge', icon: '&#9830;', check: () => game.state.knowledge >= 500 },
        { id: 'clicker', name: 'Tireless Recruiter', desc: 'Click 100 times', icon: '&#9997;', check: () => game.state.totalClicks >= 100 },
        { id: 'mega_clicker', name: 'Master Recruiter', desc: 'Click 1,000 times', icon: '&#9997;', check: () => game.state.totalClicks >= 1000 },
        { id: 'first_prestige', name: 'New Era', desc: 'Advance to a new era', icon: '&#9733;', check: () => game.state.totalPrestiges >= 1 },
        { id: 'era3', name: 'Medieval Times', desc: 'Reach the Medieval era', icon: '&#9876;', check: () => game.state.era >= 2 },
        { id: 'era5', name: 'Industrialist', desc: 'Reach the Industrial era', icon: '&#9881;', check: () => game.state.era >= 4 },
        { id: 'builder', name: 'Builder', desc: 'Own 10 total buildings', icon: '&#9962;', check: () => { let t = 0; for (const k in game.state.buildings) t += game.state.buildings[k]; return t >= 10; } },
        { id: 'mega_builder', name: 'Architect', desc: 'Own 50 total buildings', icon: '&#9962;', check: () => { let t = 0; for (const k in game.state.buildings) t += game.state.buildings[k]; return t >= 50; } },
        { id: 'millionaire', name: 'Millionaire', desc: 'Have 1,000,000 total gold earned', icon: '&#9672;', check: () => game.state.totalGold >= 1000000 },
    ],

    // --- Internal multipliers ---
    _speechMulti: 1,
    _tradeMulti: 1,
    _studyMulti: 1,
    _buildDiscount: 1,

    // ========================
    // Initialization
    // ========================
    init() {
        this.load();
        this.setupTabs();
        this.renderAll();
        this.startGameLoop();
        this.log('Welcome to Revolution Idle 2! Click to recruit followers and start your revolution.');
        this.autoSaveInterval = setInterval(() => this.save(), 30000);

        // Calculate offline gains
        if (this.state.offlineTime > 0) {
            const offlineSec = Math.min(this.state.offlineTime / 1000, 3600 * 8); // Cap at 8 hours
            const gains = {
                followers: Math.floor(this.state.followersPerSec * offlineSec * 0.5),
                influence: Math.floor(this.state.influencePerSec * offlineSec * 0.5),
                gold: Math.floor(this.state.goldPerSec * offlineSec * 0.5),
                knowledge: Math.floor(this.state.knowledgePerSec * offlineSec * 0.5),
            };
            if (gains.followers > 0 || gains.influence > 0 || gains.gold > 0 || gains.knowledge > 0) {
                this.state.followers += gains.followers;
                this.state.influence += gains.influence;
                this.state.gold += gains.gold;
                this.state.knowledge += gains.knowledge;
                this.state.totalFollowers += gains.followers;
                this.state.totalInfluence += gains.influence;
                this.state.totalGold += gains.gold;
                this.state.totalKnowledge += gains.knowledge;
                this.log(`Offline for ${this.formatTime(offlineSec)}: +${this.formatNum(gains.followers)} followers, +${this.formatNum(gains.influence)} influence, +${this.formatNum(gains.gold)} gold, +${this.formatNum(gains.knowledge)} knowledge (50% efficiency)`, 'important');
            }
            this.state.offlineTime = 0;
        }
    },

    // ========================
    // Game Loop
    // ========================
    startGameLoop() {
        let lastTick = performance.now();
        const loop = (now) => {
            const dt = (now - lastTick) / 1000;
            lastTick = now;
            this.tick(dt);
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    },

    tick(dt) {
        const multi = this.state.eraMultiplier;

        // Production
        const fGain = this.state.followersPerSec * multi * dt;
        const iGain = this.state.influencePerSec * multi * dt;
        const gGain = this.state.goldPerSec * multi * dt;
        const kGain = this.state.knowledgePerSec * multi * dt;

        this.state.followers += fGain;
        this.state.influence += iGain;
        this.state.gold += gGain;
        this.state.knowledge += kGain;

        this.state.totalFollowers += fGain;
        this.state.totalInfluence += iGain;
        this.state.totalGold += gGain;
        this.state.totalKnowledge += kGain;

        // Update UI
        this.updateResources();
        this.updateButtons();
        this.checkAchievements();
        this.updatePrestige();
    },

    // ========================
    // Click Actions
    // ========================
    recruit() {
        const gain = this.state.clickPower * this.state.eraMultiplier;
        this.state.followers += gain;
        this.state.totalFollowers += gain;
        this.state.totalClicks++;
        this.spawnParticle(`+${this.formatNum(gain)}`, 'var(--accent-red)');
        this.pulseResource('res-followers');
    },

    giveSpeech() {
        const cost = 5;
        if (this.state.followers < cost) return;
        this.state.followers -= cost;
        const gain = Math.floor(3 * this._speechMulti * this.state.eraMultiplier);
        this.state.influence += gain;
        this.state.totalInfluence += gain;
        this.state.totalClicks++;
        this.spawnParticle(`+${this.formatNum(gain)} influence`, 'var(--accent-gold)');
        this.pulseResource('res-influence');
    },

    trade() {
        const cost = 10;
        if (this.state.influence < cost) return;
        this.state.influence -= cost;
        const gain = Math.floor(5 * this._tradeMulti * this.state.eraMultiplier);
        this.state.gold += gain;
        this.state.totalGold += gain;
        this.state.totalClicks++;
        this.spawnParticle(`+${this.formatNum(gain)} gold`, '#ffd700');
        this.pulseResource('res-gold');
    },

    study() {
        const cost = 20;
        if (this.state.gold < cost) return;
        this.state.gold -= cost;
        const gain = Math.floor(3 * this._studyMulti * this.state.eraMultiplier);
        this.state.knowledge += gain;
        this.state.totalKnowledge += gain;
        this.state.totalClicks++;
        this.spawnParticle(`+${this.formatNum(gain)} knowledge`, 'var(--accent-blue)');
        this.pulseResource('res-knowledge');
    },

    // ========================
    // Upgrades
    // ========================
    buyUpgrade(id) {
        const upg = this.upgradesData.find(u => u.id === id);
        if (!upg || this.state.ownedUpgrades.includes(id)) return;
        if (!this.canAfford(upg.cost)) return;
        this.payCost(upg.cost);
        this.state.ownedUpgrades.push(id);
        upg.effect();
        this.log(`Upgrade purchased: ${upg.name}`, 'important');
        this.renderUpgrades();
    },

    // ========================
    // Buildings
    // ========================
    buyBuilding(id) {
        const bld = this.buildingsData.find(b => b.id === id);
        if (!bld) return;
        const count = this.state.buildings[id] || 0;
        const cost = this.getBuildingCost(bld, count);
        if (!this.canAfford(cost)) return;
        this.payCost(cost);
        this.state.buildings[id] = count + 1;

        // Apply production
        for (const res in bld.perSec) {
            this.state[res + 'PerSec'] += bld.perSec[res];
        }

        this.log(`Built: ${bld.name} (#${this.state.buildings[id]})`, 'important');
        this.renderBuildings();
    },

    getBuildingCost(bld, count) {
        const cost = {};
        for (const res in bld.baseCost) {
            cost[res] = Math.floor(bld.baseCost[res] * Math.pow(bld.costScale, count) * this._buildDiscount);
        }
        return cost;
    },

    // ========================
    // Research
    // ========================
    buyResearch(id) {
        const res = this.researchData.find(r => r.id === id);
        if (!res || this.state.research.includes(id)) return;
        if (!this.canAfford(res.cost)) return;
        this.payCost(res.cost);
        this.state.research.push(id);
        res.effect();
        this.log(`Research complete: ${res.name}`, 'important');
        this.renderResearch();
    },

    // ========================
    // Prestige (Era Advance)
    // ========================
    getPrestigeCost() {
        return Math.floor(1000 * Math.pow(5, this.state.era));
    },

    updatePrestige() {
        const cost = this.getPrestigeCost();
        const btn = document.getElementById('prestige-btn');
        const costSpan = document.getElementById('prestige-cost');
        costSpan.textContent = this.formatNum(cost);
        btn.disabled = this.state.influence < cost || this.state.era >= this.eras.length - 1;
    },

    prestige() {
        const cost = this.getPrestigeCost();
        if (this.state.influence < cost) return;
        if (this.state.era >= this.eras.length - 1) return;

        if (!confirm(`Advance to the ${this.eras[this.state.era + 1].name} era? This will reset your resources and buildings but you gain a permanent ${((this.state.era + 2) * 50)}% production multiplier!`)) return;

        const newEra = this.state.era + 1;
        const newMultiplier = 1 + (newEra * 0.5);

        // Keep persistent stats
        const totalClicks = this.state.totalClicks;
        const totalFollowers = this.state.totalFollowers;
        const totalInfluence = this.state.totalInfluence;
        const totalGold = this.state.totalGold;
        const totalKnowledge = this.state.totalKnowledge;
        const totalPrestiges = this.state.totalPrestiges + 1;
        const achievements = [...this.state.achievements];
        const startTime = this.state.startTime;

        // Reset state
        this.state.followers = 0;
        this.state.influence = 0;
        this.state.gold = 0;
        this.state.knowledge = 0;
        this.state.clickPower = 1;
        this.state.followersPerSec = 0;
        this.state.influencePerSec = 0;
        this.state.goldPerSec = 0;
        this.state.knowledgePerSec = 0;
        this.state.ownedUpgrades = [];
        this.state.buildings = {};
        this.state.research = [];

        // Restore persistent
        this.state.era = newEra;
        this.state.eraMultiplier = newMultiplier;
        this.state.totalClicks = totalClicks;
        this.state.totalFollowers = totalFollowers;
        this.state.totalInfluence = totalInfluence;
        this.state.totalGold = totalGold;
        this.state.totalKnowledge = totalKnowledge;
        this.state.totalPrestiges = totalPrestiges;
        this.state.achievements = achievements;
        this.state.startTime = startTime;

        // Reset internal multipliers
        this._speechMulti = 1;
        this._tradeMulti = 1;
        this._studyMulti = 1;
        this._buildDiscount = 1;

        this.log(`ERA ADVANCED: Welcome to the ${this.eras[newEra].name} era! Production multiplier: x${newMultiplier.toFixed(1)}`, 'prestige');

        // Update era display
        document.getElementById('prestige-level').textContent = `Era: ${this.eras[newEra].name}`;
        document.getElementById('prestige-level').style.color = this.eras[newEra].color;

        this.renderAll();
        this.save();
    },

    // ========================
    // Achievements
    // ========================
    checkAchievements() {
        for (const ach of this.achievementsData) {
            if (this.state.achievements.includes(ach.id)) continue;
            if (ach.check()) {
                this.state.achievements.push(ach.id);
                this.log(`Achievement unlocked: ${ach.name}!`, 'important');
                this.renderAchievements();
            }
        }
    },

    // ========================
    // Helpers
    // ========================
    canAfford(cost) {
        for (const res in cost) {
            if ((this.state[res] || 0) < cost[res]) return false;
        }
        return true;
    },

    payCost(cost) {
        for (const res in cost) {
            this.state[res] -= cost[res];
        }
    },

    formatNum(n) {
        n = Math.floor(n);
        if (n < 1000) return n.toString();
        if (n < 1e6) return (n / 1e3).toFixed(1) + 'K';
        if (n < 1e9) return (n / 1e6).toFixed(2) + 'M';
        if (n < 1e12) return (n / 1e9).toFixed(2) + 'B';
        if (n < 1e15) return (n / 1e12).toFixed(2) + 'T';
        return (n / 1e15).toFixed(2) + 'Q';
    },

    formatTime(seconds) {
        seconds = Math.floor(seconds);
        if (seconds < 60) return seconds + 's';
        if (seconds < 3600) return Math.floor(seconds / 60) + 'm ' + (seconds % 60) + 's';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return h + 'h ' + m + 'm';
    },

    costString(cost) {
        const parts = [];
        for (const res in cost) {
            const has = this.state[res] || 0;
            const need = cost[res];
            const color = has >= need ? 'var(--accent-green)' : 'var(--accent-red)';
            parts.push(`<span style="color:${color}">${this.formatNum(need)} ${res}</span>`);
        }
        return parts.join(', ');
    },

    // ========================
    // UI Updates
    // ========================
    updateResources() {
        const m = this.state.eraMultiplier;
        document.getElementById('followers-count').textContent = this.formatNum(this.state.followers);
        document.getElementById('influence-count').textContent = this.formatNum(this.state.influence);
        document.getElementById('gold-count').textContent = this.formatNum(this.state.gold);
        document.getElementById('knowledge-count').textContent = this.formatNum(this.state.knowledge);

        document.getElementById('followers-rate').textContent = `+${this.formatNum(this.state.followersPerSec * m)}/s`;
        document.getElementById('influence-rate').textContent = `+${this.formatNum(this.state.influencePerSec * m)}/s`;
        document.getElementById('gold-rate').textContent = `+${this.formatNum(this.state.goldPerSec * m)}/s`;
        document.getElementById('knowledge-rate').textContent = `+${this.formatNum(this.state.knowledgePerSec * m)}/s`;
    },

    updateButtons() {
        document.getElementById('btn-speech').disabled = this.state.followers < 5;
        document.getElementById('btn-trade').disabled = this.state.influence < 10;
        document.getElementById('btn-study').disabled = this.state.gold < 20;
    },

    pulseResource(id) {
        const el = document.getElementById(id);
        el.classList.remove('pulse-anim');
        void el.offsetWidth;
        el.classList.add('pulse-anim');
    },

    spawnParticle(text, color) {
        const container = document.getElementById('click-particles');
        const p = document.createElement('div');
        p.className = 'particle';
        p.textContent = text;
        p.style.color = color;
        p.style.left = (Math.random() * 60 + 20) + '%';
        p.style.top = (Math.random() * 30 + 40) + '%';
        container.appendChild(p);
        setTimeout(() => p.remove(), 1000);
    },

    // ========================
    // Rendering
    // ========================
    renderAll() {
        this.renderUpgrades();
        this.renderBuildings();
        this.renderResearch();
        this.renderAchievements();
        this.renderStats();
        this.updateResources();
        this.updateButtons();

        // Update era display
        const era = this.eras[this.state.era];
        document.getElementById('prestige-level').textContent = `Era: ${era.name}`;
        document.getElementById('prestige-level').style.color = era.color;
    },

    renderUpgrades() {
        const list = document.getElementById('upgrades-list');
        list.innerHTML = '';
        for (const upg of this.upgradesData) {
            const owned = this.state.ownedUpgrades.includes(upg.id);
            const afford = this.canAfford(upg.cost);
            const card = document.createElement('div');
            card.className = 'card' + (owned ? ' owned' : '');
            card.innerHTML = `
                <div class="card-info">
                    <div class="card-title">${upg.name}</div>
                    <div class="card-desc">${upg.desc}</div>
                    <div class="card-count">Cost: ${this.costString(upg.cost)}</div>
                </div>
                <button class="card-btn" ${owned || !afford ? 'disabled' : ''} onclick="game.buyUpgrade('${upg.id}')">${owned ? 'Owned' : 'Buy'}</button>
            `;
            list.appendChild(card);
        }
    },

    renderBuildings() {
        const list = document.getElementById('buildings-list');
        list.innerHTML = '';
        for (const bld of this.buildingsData) {
            const count = this.state.buildings[bld.id] || 0;
            const cost = this.getBuildingCost(bld, count);
            const afford = this.canAfford(cost);
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-info">
                    <div class="card-title">${bld.name} <span style="color:var(--accent-gold)">(${count})</span></div>
                    <div class="card-desc">${bld.desc}</div>
                    <div class="card-count">Cost: ${this.costString(cost)}</div>
                </div>
                <button class="card-btn building-btn" ${!afford ? 'disabled' : ''} onclick="game.buyBuilding('${bld.id}')">Build</button>
            `;
            list.appendChild(card);
        }
    },

    renderResearch() {
        const list = document.getElementById('research-list');
        list.innerHTML = '';
        for (const res of this.researchData) {
            const owned = this.state.research.includes(res.id);
            const afford = this.canAfford(res.cost);
            const card = document.createElement('div');
            card.className = 'card' + (owned ? ' owned' : '');
            card.innerHTML = `
                <div class="card-info">
                    <div class="card-title">${res.name}</div>
                    <div class="card-desc">${res.desc}</div>
                    <div class="card-count">Cost: ${this.costString(res.cost)}</div>
                </div>
                <button class="card-btn research-btn" ${owned || !afford ? 'disabled' : ''} onclick="game.buyResearch('${res.id}')">${owned ? 'Done' : 'Research'}</button>
            `;
            list.appendChild(card);
        }
    },

    renderAchievements() {
        const list = document.getElementById('achievements-list');
        list.innerHTML = '';
        for (const ach of this.achievementsData) {
            const unlocked = this.state.achievements.includes(ach.id);
            const card = document.createElement('div');
            card.className = 'achievement-card ' + (unlocked ? 'unlocked' : 'locked');
            card.innerHTML = `
                <span class="ach-icon">${ach.icon}</span>
                <div class="ach-info">
                    <div class="ach-name">${unlocked ? ach.name : '???'}</div>
                    <div class="ach-desc">${unlocked ? ach.desc : 'Hidden achievement'}</div>
                </div>
            `;
            list.appendChild(card);
        }
    },

    renderStats() {
        const el = document.getElementById('stats-content');
        const playtime = Math.floor((Date.now() - this.state.startTime) / 1000);
        el.innerHTML = `
            <div class="stat-row"><span class="stat-label">Current Era</span><span class="stat-value">${this.eras[this.state.era].name}</span></div>
            <div class="stat-row"><span class="stat-label">Era Multiplier</span><span class="stat-value">x${this.state.eraMultiplier.toFixed(1)}</span></div>
            <div class="stat-row"><span class="stat-label">Total Prestiges</span><span class="stat-value">${this.state.totalPrestiges}</span></div>
            <div class="stat-row"><span class="stat-label">Click Power</span><span class="stat-value">${this.formatNum(this.state.clickPower)}</span></div>
            <div class="stat-row"><span class="stat-label">Total Clicks</span><span class="stat-value">${this.formatNum(this.state.totalClicks)}</span></div>
            <div class="stat-row"><span class="stat-label">Total Followers Earned</span><span class="stat-value">${this.formatNum(this.state.totalFollowers)}</span></div>
            <div class="stat-row"><span class="stat-label">Total Influence Earned</span><span class="stat-value">${this.formatNum(this.state.totalInfluence)}</span></div>
            <div class="stat-row"><span class="stat-label">Total Gold Earned</span><span class="stat-value">${this.formatNum(this.state.totalGold)}</span></div>
            <div class="stat-row"><span class="stat-label">Total Knowledge Earned</span><span class="stat-value">${this.formatNum(this.state.totalKnowledge)}</span></div>
            <div class="stat-row"><span class="stat-label">Achievements</span><span class="stat-value">${this.state.achievements.length} / ${this.achievementsData.length}</span></div>
            <div class="stat-row"><span class="stat-label">Upgrades</span><span class="stat-value">${this.state.ownedUpgrades.length} / ${this.upgradesData.length}</span></div>
            <div class="stat-row"><span class="stat-label">Research</span><span class="stat-value">${this.state.research.length} / ${this.researchData.length}</span></div>
            <div class="stat-row"><span class="stat-label">Playtime</span><span class="stat-value">${this.formatTime(playtime)}</span></div>
        `;
    },

    // ========================
    // Tabs
    // ========================
    setupTabs() {
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById('panel-' + tab.dataset.tab).classList.add('active');

                // Refresh rendered panel
                if (tab.dataset.tab === 'stats') this.renderStats();
                if (tab.dataset.tab === 'achievements') this.renderAchievements();
                if (tab.dataset.tab === 'upgrades') this.renderUpgrades();
                if (tab.dataset.tab === 'buildings') this.renderBuildings();
                if (tab.dataset.tab === 'research') this.renderResearch();
            });
        });

        // Prestige button
        document.getElementById('prestige-btn').addEventListener('click', () => this.prestige());
    },

    // ========================
    // Log
    // ========================
    log(msg, cls = '') {
        const container = document.getElementById('log-messages');
        const el = document.createElement('div');
        el.className = 'log-msg ' + cls;
        el.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
        container.prepend(el);

        // Keep last 50 messages
        while (container.children.length > 50) {
            container.removeChild(container.lastChild);
        }
    },

    // ========================
    // Save / Load
    // ========================
    save() {
        try {
            this.state.lastSave = Date.now();
            const data = JSON.stringify(this.state);
            localStorage.setItem('revolution_idle_2_save', data);
            this.log('Game saved.');
        } catch (e) {
            this.log('Save failed: ' + e.message);
        }
    },

    load() {
        try {
            const data = localStorage.getItem('revolution_idle_2_save');
            if (!data) return;
            const saved = JSON.parse(data);

            // Calculate offline time
            if (saved.lastSave) {
                saved.offlineTime = Date.now() - saved.lastSave;
            }

            // Merge with defaults
            for (const key in saved) {
                if (this.state.hasOwnProperty(key)) {
                    this.state[key] = saved[key];
                }
            }

            // Re-apply owned upgrades effects
            this._speechMulti = 1;
            this._tradeMulti = 1;
            this._studyMulti = 1;
            this._buildDiscount = 1;
            this.state.clickPower = 1;
            this.state.followersPerSec = 0;
            this.state.influencePerSec = 0;
            this.state.goldPerSec = 0;
            this.state.knowledgePerSec = 0;

            for (const id of this.state.ownedUpgrades) {
                const upg = this.upgradesData.find(u => u.id === id);
                if (upg) upg.effect();
            }

            for (const id of this.state.research) {
                const res = this.researchData.find(r => r.id === id);
                if (res) res.effect();
            }

            // Re-apply building production
            for (const id in this.state.buildings) {
                const bld = this.buildingsData.find(b => b.id === id);
                if (bld) {
                    const count = this.state.buildings[id];
                    for (const res in bld.perSec) {
                        this.state[res + 'PerSec'] += bld.perSec[res] * count;
                    }
                }
            }

            this.log('Game loaded.');
            this.renderAll();
        } catch (e) {
            this.log('Load failed: ' + e.message);
        }
    },

    hardReset() {
        if (!confirm('Are you sure? This will DELETE ALL progress!')) return;
        if (!confirm('Really? This cannot be undone!')) return;
        localStorage.removeItem('revolution_idle_2_save');
        location.reload();
    },
};

// === Start the game ===
window.addEventListener('load', () => game.init());
