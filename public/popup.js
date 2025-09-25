// Tough as a Tank Challenge Registration Popup
// Embeds on Universal Truck Service website

(function() {
    'use strict';
    
    // Configuration
    const API_BASE = 'https://tough-as-a-tank-final.onrender.com/api';
    const POPUP_REAPPEAR_DELAY = 45000; // 45 seconds
    
    let popupShown = false;
    let registrationComplete = false;
    let participantCount = 0;
    
    // Check if user already registered
    if (localStorage.getItem('toughAsTankRegistered')) {
        registrationComplete = true;
    }
    
    // Create popup HTML
    function createPopupHTML() {
        return `
            <div id="toughTankPopup" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 99999;
                font-family: Arial, sans-serif;
            ">
                <div style="
                    background: white;
                    border-radius: 15px;
                    padding: 2rem;
                    max-width: 500px;
                    width: 90%;
                    position: relative;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                    max-height: 90vh;
                    overflow-y: auto;
                ">
                    <span id="toughTankClose" style="
                        position: absolute;
                        top: 15px;
                        right: 20px;
                        font-size: 28px;
                        cursor: pointer;
                        color: #666;
                        font-weight: bold;
                    ">&times;</span>
                    
                    <div style="text-align: center; margin-bottom: 2rem; color: #dc2626;">
                        <div style="font-size: 48px; margin-bottom: 10px;">🏆</div>
                        <h2 style="margin: 0 0 5px 0; font-size: 24px;">JOIN THE CHALLENGE!</h2>
                        <h3 style="margin: 0 0 5px 0; font-size: 20px; color: #991b1b;">Tough as a Tank</h3>
                        <p style="margin: 0; color: #dc2626;">Grip Strength Competition</p>
                    </div>
                    
                    <div id="toughTankCounter" style="
                        background: #fef2f2;
                        border: 2px solid #fca5a5;
                        border-radius: 8px;
                        padding: 15px;
                        margin-bottom: 2rem;
                        text-align: center;
                        color: #991b1b;
                        font-weight: bold;
                    ">
                        Join <span id="toughTankCount">${participantCount}</span> others competing for prizes!
                    </div>
                    
                    <div id="toughTankSuccess" style="
                        background: #d1fae5;
                        border: 2px solid #10b981;
                        color: #064e3b;
                        padding: 20px;
                        border-radius: 8px;
                        text-align: center;
                        font-weight: bold;
                        margin-bottom: 2rem;
                        display: none;
                    ">
                        ✅ Registration successful! Head to the competition area when ready.
                    </div>
                    
                    <form id="toughTankForm">
                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #374151;">Full Name *</label>
                            <input type="text" id="toughTankName" name="name" required style="
                                width: 100%;
                                padding: 12px;
                                border: 2px solid #d1d5db;
                                border-radius: 8px;
                                font-size: 16px;
                                box-sizing: border-box;
                            ">
                        </div>
                        
                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #374151;">Email Address *</label>
                            <input type="email" id="toughTankEmail" name="email" required style="
                                width: 100%;
                                padding: 12px;
                                border: 2px solid #d1d5db;
                                border-radius: 8px;
                                font-size: 16px;
                                box-sizing: border-box;
                            ">
                        </div>
                        
                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #374151;">Phone Number *</label>
                            <input type="tel" id="toughTankPhone" name="phone" required style="
                                width: 100%;
                                padding: 12px;
                                border: 2px solid #d1d5db;
                                border-radius: 8px;
                                font-size: 16px;
                                box-sizing: border-box;
                            ">
                        </div>
                        
                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #374151;">Company/Organization *</label>
                            <input type="text" id="toughTankCompany" name="company" required style="
                                width: 100%;
                                padding: 12px;
                                border: 2px solid #d1d5db;
                                border-radius: 8px;
                                font-size: 16px;
                                box-sizing: border-box;
                            ">
                        </div>
                        
                        <button type="submit" id="toughTankSubmit" style="
                            width: 100%;
                            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
                            color: white;
                            border: none;
                            padding: 15px;
                            border-radius: 8px;
                            font-size: 18px;
                            font-weight: bold;
                            cursor: pointer;
                            transition: transform 0.2s;
                        ">
                            Join the Tough as a Tank Challenge
                        </button>
                    </form>
                    
                    <p style="text-align: center; margin-top: 1rem; font-size: 12px; color: #666;">
                        Your information is secure and will only be used for this competition.
                    </p>
                </div>
            </div>
        `;
    }
    
    // Show popup
    function showPopup() {
        if (registrationComplete || popupShown) return;
        
        const popup = document.createElement('div');
        popup.innerHTML = createPopupHTML();
        document.body.appendChild(popup);
        
        popupShown = true;
        
        // Load participant count
        loadParticipantCount();
        
        // Add event listeners
        document.getElementById('toughTankClose').addEventListener('click', closePopup);
        document.getElementById('toughTankForm').addEventListener('submit', handleSubmit);
        
        // Close popup when clicking outside
        document.getElementById('toughTankPopup').addEventListener('click', function(e) {
            if (e.target.id === 'toughTankPopup') {
                closePopup();
            }
        });
    }
    
    // Close popup
    function closePopup() {
        const popup = document.getElementById('toughTankPopup');
        if (popup) {
            popup.remove();
            popupShown = false;
        }
    }
    
    // Load participant count
    async function loadParticipantCount() {
        try {
            const response = await fetch(`${API_BASE}/participant-count`);
            const data = await response.json();
            const countElement = document.getElementById('toughTankCount');
            if (countElement) {
                countElement.textContent = data.count;
            }
        } catch (error) {
            console.error('Failed to load participant count:', error);
        }
    }
    
    // Handle form submission
    async function handleSubmit(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById('toughTankSubmit');
        const formData = new FormData(e.target);
        
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            company: formData.get('company')
        };
        
        submitBtn.textContent = 'Registering...';
        submitBtn.disabled = true;
        
        try {
            const response = await fetch(`${API_BASE}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                // Success
                localStorage.setItem('toughAsTankRegistered', 'true');
                registrationComplete = true;
                
                // Hide form, show success message
                document.getElementById('toughTankForm').style.display = 'none';
                document.getElementById('toughTankSuccess').style.display = 'block';
                
                // Update participant count
                loadParticipantCount();
                
                // Close popup after 3 seconds
                setTimeout(closePopup, 3000);
                
            } else {
                const error = await response.json();
                alert(error.error || 'Registration failed. Please try again.');
            }
        } catch (error) {
            alert('Network error. Please check your connection.');
        }
        
        submitBtn.textContent = 'Join the Tough as a Tank Challenge';
        submitBtn.disabled = false;
    }
    
    // Initialize popup behavior
    function init() {
        if (registrationComplete) return;
        
        // Show popup immediately
        setTimeout(showPopup, 1000);
        
        // Set up reappearance timer
        setInterval(() => {
            if (!registrationComplete && !popupShown) {
                showPopup();
            }
        }, POPUP_REAPPEAR_DELAY);
    }
    
    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
