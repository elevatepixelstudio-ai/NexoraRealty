document.addEventListener('DOMContentLoaded', () => {
    const header = document.getElementById('header');
    
    // Dynamic Header State Logic
    const adminLoggedIn = localStorage.getItem('nexora_admin_logged_in') === 'true';
    const loginBtn = document.querySelector('.nav-actions a.btn-outline');
    const portalBtn = document.querySelector('.nav-actions a.btn-primary');

    if (adminLoggedIn) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (portalBtn) {
            portalBtn.textContent = 'Admin Console';
            portalBtn.href = 'admin.html';
        }
    }

    // Header scroll effect
    if (header) {
        const logoImg = header.querySelector('.logo img');
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
                if (logoImg) logoImg.style.height = '70px';
            } else {
                header.classList.remove('scrolled');
                if (logoImg) logoImg.style.height = '110px';
            }
        });
    }

    // Dynamic Property Loading
    const featuredContainer = document.getElementById('featured-properties-container');
    const allPropertiesContainer = document.getElementById('all-properties-container');
    const propertyCountEl = document.getElementById('property-count');

    // Load from centralized database (data/properties.js) + Local Admin Additions
    const localData = JSON.parse(localStorage.getItem('NEXORA_LOCAL_PROPERTIES') || '[]');
    let allProperties = (typeof NEXORA_PROPERTIES !== 'undefined') ? [...NEXORA_PROPERTIES, ...localData] : localData;

    function loadProperties() {
        // Re-Sync Data every time we load to ensure local additions are included
        const localData = JSON.parse(localStorage.getItem('NEXORA_LOCAL_PROPERTIES') || '[]');
        allProperties = (typeof NEXORA_PROPERTIES !== 'undefined') ? [...NEXORA_PROPERTIES, ...localData] : localData;

        setupFilters();

        if (allProperties.length === 0) return;

        if (featuredContainer) {
            renderProperties(allProperties.filter(p => p.featured), featuredContainer);
        }
        
        if (allPropertiesContainer) {
            renderProperties(allProperties, allPropertiesContainer);
            updatePropertyCount(allProperties.length);
        }

        if (window.lucide) window.lucide.createIcons();
    }

    window.getAIInsight = function(property) {
        const luxuryThreshold = 5.0; // Cr
        const techHubs = ['Kharadi', 'Hinjewadi', 'Baner Hills'];
        const growthHotspots = ['Wagholi', 'Viman Nagar'];
        
        const priceNum = parseFloat(property.price.replace(/[₹\sCr]/g, ''));
        
        if (priceNum >= luxuryThreshold) {
            return { label: 'Elite Portfolio', icon: 'crown', color: '#ffd700' };
        }
        if (techHubs.includes(property.location)) {
            return { label: 'High Tech-Hub Growth', icon: 'trending-up', color: '#4ade80' };
        }
        if (growthHotspots.includes(property.location)) {
            return { label: 'High Appreciation', icon: 'bar-chart', color: '#fbbf24' };
        }
        return { label: 'Prime Connectivity', icon: 'zap', color: '#60a5fa' };
    }

    function renderProperties(properties, container) {
        if (!container) return;
        
        if (properties.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 4rem; background: var(--white); border-radius: var(--radius-xl); border: 1px dashed var(--gray-200);">
                    <i data-lucide="search-x" size="48" style="color: var(--gray-300); margin-bottom: 1rem;"></i>
                    <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem; color: var(--gray-900);">No matches found</h3>
                    <p style="color: var(--gray-500);">Try adjusting your filters to see more properties.</p>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
            return;
        }

        container.innerHTML = properties.map(property => {
            const insight = getAIInsight(property);
            
            return `
                <div class="property-card" onclick="window.location.href='property-details.html?id=${property.id}'">
                    <div class="property-image">
                        <img src="${property.image}" alt="${property.title}">
                        <span class="property-badge">${property.badge}</span>
                        <div class="ai-insight-badge" style="border-left: 3px solid ${insight.color};">
                            <i data-lucide="${insight.icon}" size="12"></i> ${insight.label}
                        </div>
                        <button class="btn-fav" onclick="event.stopPropagation(); toggleFavorite(${property.id}, this)">
                            <i data-lucide="heart" size="18"></i>
                        </button>
                    </div>
                    <div class="property-info">
                        <span class="property-type">${property.type}</span>
                        <h3 class="property-title">${property.title}</h3>
                        <p class="property-location">
                            <i data-lucide="map-pin" size="16"></i>
                            ${property.location}, Pune
                        </p>
                        <div class="property-features">
                            <span class="feature"><i data-lucide="bed"></i> ${property.beds} Beds</span>
                            <span class="feature"><i data-lucide="bath"></i> ${property.baths} Baths</span>
                            <span class="feature"><i data-lucide="maximize"></i> ${property.sqft} sqft</span>
                        </div>
                        <div class="property-footer">
                            <span class="property-price">${property.price}</span>
                            <div class="property-actions">
                                <button class="btn-360">
                                    <i data-lucide="rotate-3d"></i> 360°
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        if (window.lucide) window.lucide.createIcons();
        setupAnimations(); 
    }

    function updatePropertyCount(count) {
        if (propertyCountEl) propertyCountEl.textContent = count;
    }

    function setupFilters() {
        const homeSearchBtn = document.getElementById('home-search-btn');

        if (homeSearchBtn) {
            homeSearchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Immediate Visual Feedback
                const originalContent = homeSearchBtn.innerHTML;
                homeSearchBtn.innerHTML = '<i data-lucide="loader-2" class="animate-spin"></i>';
                if (window.lucide) window.lucide.createIcons();

                const locInput = document.getElementById('home-search-location');
                const typeInput = document.getElementById('home-search-type');
                const budgetInput = document.getElementById('home-search-budget');

                if (!locInput || !typeInput || !budgetInput) {
                    homeSearchBtn.innerHTML = originalContent;
                    if (window.lucide) window.lucide.createIcons();
                    return;
                }

                const loc = locInput.value.toLowerCase();
                const type = typeInput.value;
                const budget = budgetInput.value;
                
                if (featuredContainer) {
                    let filtered = allProperties.filter(p => {
                        const locMatch = loc === 'all' || loc === '' || p.location.toLowerCase().includes(loc);
                        const typeMatch = type === 'all' || p.type === type;
                        
                        let priceMatch = true;
                        const numericPrice = parseFloat(p.price.replace(/[₹\sCr]/g, ''));
                        if (budget !== 'all') {
                            if (budget === '0-1.5') priceMatch = numericPrice <= 1.5;
                            else if (budget === '1.5-2') priceMatch = numericPrice > 1.5 && numericPrice <= 2;
                            else if (budget === '2-2.5') priceMatch = numericPrice > 2 && numericPrice <= 2.5;
                            else if (budget === '2.5-3') priceMatch = numericPrice > 2.5 && numericPrice <= 3;
                            else if (budget === '3-4') priceMatch = numericPrice > 3 && numericPrice <= 4;
                            else if (budget === '4-5') priceMatch = numericPrice > 4 && numericPrice <= 5;
                            else if (budget === '5-10') priceMatch = numericPrice > 5 && numericPrice <= 10;
                            else if (budget === '10-20') priceMatch = numericPrice > 10 && numericPrice <= 20;
                            else if (budget === '20-above') priceMatch = numericPrice > 20;
                        }
                        return locMatch && typeMatch && priceMatch;
                    });
                    
                    renderProperties(filtered, featuredContainer);
                    
                    // Smooth scroll to results
                    const propSection = document.getElementById('properties');
                    if (propSection) propSection.scrollIntoView({ behavior: 'smooth' });

                    // Restore button
                    setTimeout(() => {
                        homeSearchBtn.innerHTML = originalContent;
                        if (window.lucide) window.lucide.createIcons();
                    }, 500);
                } else {
                    window.location.href = `properties.html?loc=${encodeURIComponent(loc)}&type=${encodeURIComponent(type)}&price=${encodeURIComponent(budget)}`;
                }
            });
        }

        const applyBtn = document.getElementById('apply-filters');
        if (applyBtn) {
            applyBtn.addEventListener('click', applyFilters);
        }

        // Real-time updates for sliders
        const sliders = ['price-min', 'area-min', 'bed-min', 'bath-min'];
        sliders.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', (e) => {
                    const valEl = document.getElementById(`${id}-val`);
                    if (valEl) {
                        if (id === 'price-min') valEl.textContent = `₹${e.target.value} Cr`;
                        else if (id === 'area-min') valEl.textContent = `${e.target.value} sqft`;
                        else if (id === 'bed-min') valEl.textContent = `${e.target.value} BHK`;
                        else if (id === 'bath-min') valEl.textContent = `${e.target.value} Bath`;
                    }
                    applyFilters();
                });
            }
        });

        // Real-time updates for checkboxes
        document.querySelectorAll('.amenity-checkbox input').forEach(cb => {
            cb.addEventListener('change', applyFilters);
        });

        // URL Param Handling
        if (allPropertiesContainer) {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('loc')) {
                // If we came from home page with a specific location, we might want to store it
                // For now, let's just trigger initial filter
                applyFilters();
            }
        }
    }

    function applyFilters() {
        if (!allPropertiesContainer) return;

        const pMin = document.getElementById('price-min')?.value || 0;
        const aMin = document.getElementById('area-min')?.value || 0;
        const btMin = document.getElementById('bath-min')?.value || 0;
        const bdMin = document.getElementById('bed-min')?.value || 0;

        // Update UI Labels
        if (document.getElementById('price-min-val')) document.getElementById('price-min-val').textContent = `${pMin} Cr`;
        if (document.getElementById('area-min-val')) document.getElementById('area-min-val').textContent = `${aMin}m`;
        if (document.getElementById('bath-min-val')) document.getElementById('bath-min-val').textContent = btMin;
        if (document.getElementById('bed-min-val')) document.getElementById('bed-min-val').textContent = bdMin;

        const keyword = document.getElementById('keyword-search')?.value.toLowerCase() || '';
        const priceMin = parseFloat(pMin);
        const areaMin = parseFloat(aMin);
        const bathMin = parseFloat(btMin);
        const bedMin = parseFloat(bdMin);
        
        const loc = document.getElementById('filter-location')?.value || 'all';
        const status = document.getElementById('filter-status')?.value || 'all';
        
        const selectedAmenities = Array.from(document.querySelectorAll('.amenity-cb input:checked')).map(cb => cb.value);

        let filtered = allProperties.filter(p => {
            const keywordMatch = keyword === '' || 
                                p.title.toLowerCase().includes(keyword) || 
                                p.location.toLowerCase().includes(keyword);

            const locMatch = loc === 'all' || p.location === loc;
            const statusMatch = status === 'all' || p.type.includes(status) || (status === 'For Sale' && p.price.includes('Cr'));

            const numericPrice = parseFloat(p.price.replace(/[₹\sCr]/g, ''));
            const priceMatch = numericPrice >= priceMin;
            const areaMatch = (p.sqft || 0) >= areaMin;
            const bathMatch = (p.baths || 0) >= bathMin;
            const bedMatch = (p.beds || 0) >= bedMin;
            
            return keywordMatch && locMatch && statusMatch && priceMatch && areaMatch && bathMatch && bedMatch;
        });

        renderProperties(filtered, allPropertiesContainer);
        updatePropertyCount(filtered.length);
    }

    // Add listeners to new sidebar inputs
    setTimeout(() => {
        ['keyword-search', 'filter-location', 'filter-status', 'price-min', 'area-min', 'bath-min', 'bed-min'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', applyFilters);
            if (el) el.addEventListener('change', applyFilters);
        });

        // Amenities
        document.querySelectorAll('.amenity-cb input').forEach(cb => {
            cb.addEventListener('change', applyFilters);
        });
    }, 100);

    function setupAnimations() {
        const animatedElements = document.querySelectorAll('.property-card');
        animatedElements.forEach((el, index) => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        });
    }

    // AI Concierge Logic
    const aiTrigger = document.getElementById('ai-trigger');
    const aiChatWindow = document.getElementById('ai-chat-window');
    const closeChat = document.getElementById('close-chat');
    const sendChat = document.getElementById('send-chat');
    const chatInput = document.getElementById('chat-input');
    const chatBody = document.getElementById('chat-body');

    if (aiTrigger) {
        aiTrigger.addEventListener('click', () => {
            aiChatWindow.classList.toggle('active');
        });
    }

    if (closeChat) {
        closeChat.addEventListener('click', () => {
            aiChatWindow.classList.remove('active');
        });
    }

    function addMessage(text, type) {
        const msg = document.createElement('div');
        msg.className = type === 'user' ? 'user-msg' : 'ai-msg';
        msg.textContent = text;
        
        // Inline styles for user message
        if (type === 'user') {
            msg.style.background = 'var(--primary)';
            msg.style.color = 'white';
            msg.style.padding = '0.85rem 1.15rem';
            msg.style.borderRadius = '18px 18px 0 18px';
            msg.style.alignSelf = 'flex-end';
            msg.style.fontSize = '0.85rem';
            msg.style.maxWidth = '85%';
            msg.style.boxShadow = '0 4px 10px rgba(184, 134, 11, 0.2)';
        }

        chatBody.appendChild(msg);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function getAIResponse(input) {
        const query = input.toLowerCase();
        if (query.includes('price') || query.includes('cost')) {
            return "Current market rates in Baner are approx ₹9,500 - ₹12,000 per sqft. Would you like a detailed price analysis report for West Pune?";
        }
        if (query.includes('location') || query.includes('area') || query.includes('neighbourhood')) {
            return "For high growth, I recommend Kharadi or Hinjewadi. For premium lifestyle, Koregaon Park and Baner Hills are top-tier. Which vibe do you prefer?";
        }
        if (query.includes('visit') || query.includes('see') || query.includes('tour')) {
            return "I can definitely schedule a site visit for you! Please leave your number or email, and our premium concierge will call you back in 5 mins.";
        }
        return "That's an interesting question! As your Nexora AI, I'm analyzing the latest Pune market trends for you. Would you like to speak to a human expert?";
    }

    if (sendChat) {
        const handleSend = () => {
            const text = chatInput.value.trim();
            if (text) {
                addMessage(text, 'user');
                chatInput.value = '';
                
                setTimeout(() => {
                    addMessage(getAIResponse(text), 'ai');
                }, 1000);
            }
        };

        sendChat.addEventListener('click', handleSend);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSend();
        });
    }

    // Favorite System (Client Portal Starter)
    window.toggleFavorite = function(id, btn) {
        let favorites = JSON.parse(localStorage.getItem('nexora_favorites') || '[]');
        const index = favorites.indexOf(id);
        
        if (index === -1) {
            favorites.push(id);
            btn.classList.add('active');
            btn.querySelector('i').setAttribute('fill', 'currentColor');
            showToast('Property added to your Client Portal!');
        } else {
            favorites.splice(index, 1);
            btn.classList.remove('active');
            btn.querySelector('i').setAttribute('fill', 'none');
            showToast('Property removed from your list.');
        }
        
        localStorage.setItem('nexora_favorites', JSON.stringify(favorites));
    }

    function showToast(msg) {
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('active'), 100);
        setTimeout(() => {
            toast.classList.remove('active');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    // AI Price Predictor Logic
    const runPredictBtn = document.getElementById('run-prediction');
    const predictionOutput = document.getElementById('prediction-output');

    if (runPredictBtn) {
        runPredictBtn.addEventListener('click', () => {
            const locality = document.getElementById('predict-locality').value;
            const bhk = document.getElementById('predict-type').value;
            
            // Show Analysis State
            predictionOutput.innerHTML = `
                <div class="analysis-loader">
                    <div class="placeholder-icon-circle animate-spin">
                        <i data-lucide="refresh-cw"></i>
                    </div>
                    <h3>AI Analyzing Market Trends...</h3>
                    <p>Correlating historical data for ${locality} corridors</p>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();

            setTimeout(() => {
                // Calculation Logic (Simulated for Pune trends)
                let basePrice = 0;
                let appreciationRate = 0.12; // 12% Avg

                if (locality === 'Baner') basePrice = (bhk === 'villa' ? 12 : (bhk === '2' ? 0.95 : 1.45));
                else if (locality === 'Kharadi') basePrice = (bhk === 'villa' ? 8 : (bhk === '2' ? 0.85 : 1.35));
                else if (locality === 'Koregaon Park') basePrice = (bhk === 'villa' ? 25 : (bhk === '2' ? 1.8 : 2.8));
                else basePrice = (bhk === 'villa' ? 10 : (bhk === '2' ? 0.9 : 1.4));

                const price2027 = (basePrice * 1.15).toFixed(2);
                const price2028 = (basePrice * 1.30).toFixed(2);
                const appreciation = "30%";

                // Corridor-Specific Strategic Data
                let roadmapData = {
                    title: "Infrastructure Roadmap",
                    sources: ["PMRDA Master Plan", "MahaMetro DPR"],
                    milestones: [
                        { icon: 'train', text: 'Metro Phase 3 connectivity (2026)' },
                        { icon: 'map', text: 'Proposed Ring Road Exit within 2km' },
                        { icon: 'building', text: 'Godrej/VTP Land Acquisition nearby' }
                    ]
                };

                if (locality === 'Kharadi') {
                    roadmapData.sources = ["PMC DP Plan 2024", "Economic Times Realty"];
                    roadmapData.milestones = [
                        { icon: 'train', text: 'Upcoming Metro connectivity to IT Park' },
                        { icon: 'trending-up', text: 'EON IT Park Phase 3 expansion project' },
                        { icon: 'building', text: 'New 20-acre land parcel acquired by Godrej' }
                    ];
                } else if (locality === 'Hinjewadi') {
                    roadmapData.sources = ["MahaMetro Project Report", "NHAI Ring Road Plan"];
                    roadmapData.milestones = [
                        { icon: 'train', text: 'Metro Blue Line (Maan to Civil Court) 2026' },
                        { icon: 'map', text: 'PMDAA Ring Road Phase 1 integration' },
                        { icon: 'maximize', text: 'Maan-Mahalunge Smart City infrastructure' }
                    ];
                }

                predictionOutput.innerHTML = `
                    <div class="prediction-box">
                        <div class="prediction-year-row">
                            <div>
                                <div class="pred-year">2027 Forecast</div>
                                <div style="color: var(--gray-400); font-size: 0.8rem;">Projected Market Value</div>
                            </div>
                            <div class="pred-price">₹${price2027} ${basePrice > 5 ? 'Cr' : 'Cr'}</div>
                        </div>
                        <div class="prediction-year-row">
                            <div>
                                <div class="pred-year">2028 Forecast</div>
                                <div style="color: var(--gray-400); font-size: 0.8rem;">Projected Market Value</div>
                            </div>
                            <div class="pred-price">₹${price2028} ${basePrice > 5 ? 'Cr' : 'Cr'}</div>
                        </div>
                        
                        <div class="roadmap-card" style="margin-top: 1.5rem; background: rgba(255,255,255,0.03); padding: 1.5rem; border-radius: var(--radius-lg); border: 1px solid rgba(255,255,255,0.05);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                                <h4 style="color: var(--primary); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 2px; margin: 0;">Strategic Roadmap</h4>
                                <span style="font-size: 0.65rem; color: var(--gray-500); background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 4px;">Verified Sources</span>
                            </div>
                            <ul style="list-style: none; padding: 0; margin: 0 0 1rem 0;">
                                ${roadmapData.milestones.map(m => `
                                    <li style="display: flex; align-items: center; gap: 0.75rem; color: var(--gray-300); font-size: 0.85rem; padding: 0.4rem 0;">
                                        <i data-lucide="${m.icon}" size="14" style="color: var(--primary);"></i> ${m.text}
                                    </li>
                                `).join('')}
                            </ul>
                            <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 0.75rem; font-size: 0.7rem; color: var(--gray-500); display: flex; gap: 1rem; flex-wrap: wrap;">
                                <span style="font-weight: 700;">Sources:</span>
                                ${roadmapData.sources.map(s => `<span style="color: var(--gray-400); font-style: italic;">• ${s}</span>`).join('')}
                            </div>
                        </div>

                        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(184, 134, 11, 0.1); padding: 1.5rem; border-radius: var(--radius-lg); margin-top: 1.5rem;">
                            <div>
                                <h4 style="margin:0; color: var(--white);">Projected Growth</h4>
                                <p style="margin:0; font-size: 0.8rem; color: var(--gray-400);">Based on ${locality} corridor trends</p>
                            </div>
                            <div class="appreciation-tag">+ ${appreciation}</div>
                        </div>
                    </div>
                `;
            }, 1500);
        });
    }

    // Virtual Tour Modal Logic (Self-Injecting)
    function injectTourModal() {
        if (document.getElementById('tour-modal')) return document.getElementById('tour-modal');
        
        const modal = document.createElement('div');
        modal.id = 'tour-modal';
        modal.className = 'tour-modal';
        modal.innerHTML = `
            <div class="tour-content">
                <button class="tour-close" id="close-tour"><i data-lucide="x"></i></button>
                <div class="tour-header">
                    <h3 id="tour-title">Immersive 360° Experience</h3>
                    <span class="tour-badge"><i data-lucide="sparkles"></i> Nexora AI-Viz</span>
                </div>
                <div class="tour-viewer" id="tour-viewer">
                    <div class="tour-loader">
                        <div class="animate-spin"><i data-lucide="refresh-cw" size="48"></i></div>
                        <p style="margin-top: 1rem;">Calibrating 3D Immersive Environment...</p>
                    </div>
                </div>
                <div class="tour-controls">
                    <div style="display: flex; gap: 1rem;">
                        <button class="btn btn-outline btn-sm room-btn active" data-room="living">Living Area</button>
                        <button class="btn btn-outline btn-sm room-btn" data-room="kitchen">Kitchen</button>
                        <button class="btn btn-outline btn-sm room-btn" data-room="bedroom">Master Bedroom</button>
                    </div>
                    <div class="tour-badge"><i data-lucide="compass"></i> Interactive View</div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        if (window.lucide) window.lucide.createIcons();
        
        // Room Switching Logic
        const roomBtns = modal.querySelectorAll('.room-btn');
        roomBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                roomBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const room = btn.dataset.room;
                const viewer = modal.querySelector('.tour-viewer');
                
                // Transition effect
                viewer.style.opacity = '0.5';
                setTimeout(() => {
                    if(room === 'kitchen') viewer.style.backgroundImage = 'url("assets/img/property-2.png")';
                    else if(room === 'bedroom') viewer.style.backgroundImage = 'url("assets/img/property-3.png")';
                    else viewer.style.backgroundImage = 'url("assets/img/hero-bg.png")';
                    
                    viewer.style.opacity = '1';
                }, 300);
            });
        });

        // Re-attach close listener
        document.getElementById('close-tour').addEventListener('click', () => {
            modal.classList.remove('active');
        });

        return modal;
    }

    function openTour(propertyTitle) {
        const modal = injectTourModal();
        const tourViewer = document.getElementById('tour-viewer');
        
        document.getElementById('tour-title').textContent = `${propertyTitle} - 360° Walkthrough`;
        modal.classList.add('active');
        
        // Show loader for 1.5s
        if (tourViewer) {
            tourViewer.innerHTML = `
                <div class="tour-loader">
                    <div class="animate-spin"><i data-lucide="refresh-cw" size="48"></i></div>
                    <p style="margin-top: 1rem;">Calibrating 3D Immersive Environment...</p>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
        }

        setTimeout(() => {
            if (tourViewer) {
                tourViewer.innerHTML = ''; 
                tourViewer.style.backgroundImage = 'url("assets/img/hero-bg.png")'; 
                tourViewer.style.backgroundSize = '200% 100%';
                tourViewer.style.backgroundRepeat = 'repeat-x';
                tourViewer.classList.add('panning-view');
                
                // Simple Drag-to-Pan Logic
                let isDragging = false;
                let startX;
                let scrollLeft;
                let bgPos = 0;

                tourViewer.addEventListener('mousedown', (e) => {
                    isDragging = true;
                    startX = e.pageX;
                    tourViewer.style.animationPlayState = 'paused';
                });

                document.addEventListener('mouseup', () => {
                    isDragging = false;
                    tourViewer.style.animationPlayState = 'running';
                });

                tourViewer.addEventListener('mousemove', (e) => {
                    if (!isDragging) return;
                    const x = e.pageX - startX;
                    bgPos += x * 0.1;
                    tourViewer.style.backgroundPositionX = `${bgPos}px`;
                    startX = e.pageX;
                });
            }
        }, 1500);
    }

    // Global click listener for dynamic 360 buttons
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-360');
        if (btn) {
            e.preventDefault();
            e.stopPropagation();
            const card = btn.closest('.property-card');
            let title = 'Property';
            
            if (card) {
                title = card.querySelector('.property-title').textContent;
            } else if (document.getElementById('detail-title')) {
                title = document.getElementById('detail-title').textContent;
            }
            
            openTour(title);
        }
    });

    loadProperties();
});
