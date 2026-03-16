// mobile-app.js

// Form Validation Functions
function validateForm(form) {
    const elements = form.elements;
    let valid = true;

    for (let i = 0; i < elements.length; i++) {
        if (elements[i].type !== "submit" && !elements[i].value) {
            valid = false;
            elements[i].classList.add('error');
        } else {
            elements[i].classList.remove('error');
        }
    }
    return valid;
}

// Password Strength Checker Function
function checkPasswordStrength(password) {
    const strengthIndicator = document.getElementById('passwordStrength');
    let strength = 0;

    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    switch (strength) {
        case 0:
            strengthIndicator.textContent = 'Very Weak';
            break;
        case 1:
            strengthIndicator.textContent = 'Weak';
            break;
        case 2:
            strengthIndicator.textContent = 'Moderate';
            break;
        case 3:
            strengthIndicator.textContent = 'Strong';
            break;
        case 4:
            strengthIndicator.textContent = 'Very Strong';
            break;
    }
}

// OTP Handling Function
let generatedOTP;
function generateOTP() {
    generatedOTP = Math.floor(100000 + Math.random() * 900000);
    console.log('Generated OTP:', generatedOTP);
    // Here you would send the OTP to the user's email/phone
}

function validateOTP(inputOTP) {
    if (inputOTP == generatedOTP) {
        alert('OTP verified successfully!');
    } else {
        alert('Invalid OTP. Please try again.');
    }
}

// Smooth Tab Switching
function switchTab(evt, tabName) {
    const tabs = document.getElementsByClassName('tabcontent');
    for (let i = 0; i < tabs.length; i++) {
        tabs[i].style.display = 'none';
    }
    const tabLinks = document.getElementsByClassName('tablinks');
    for (let i = 0; i < tabLinks.length; i++) {
        tabLinks[i].classList.remove('active');
    }
    document.getElementById(tabName).style.display = 'block';
    evt.currentTarget.classList.add('active');
}

// Event Listeners
document.getElementById('loginTab').addEventListener('click', function(event) { switchTab(event, 'Login'); });
document.getElementById('signupTab').addEventListener('click', function(event) { switchTab(event, 'Signup'); });
