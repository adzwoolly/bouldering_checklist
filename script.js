const backgroundImage = document.getElementById('backgroundImage');
const pinContainer = document.getElementById('pin-container');
const archiveBlackSetBtn = document.getElementById('archive-black-set');
const archiveRedSetBtn = document.getElementById('archive-red-set');
const archivePinkSetBtn = document.getElementById('archive-pink-set');
const archivePurpleSetBtn = document.getElementById('archive-purple-set');
const undoPinButton = document.getElementById('undoPin');
const copyLinkButton = document.getElementById('copyLink');
const copyNotification = document.getElementById('copyNotification');
const redPinRadio = document.getElementById('redPinRadio');
const pinkPinRadio = document.getElementById('pinkPinRadio');
const blackPinRadio = document.getElementById('blackPinRadio'); // New
const purplePinRadio = document.getElementById('purplePinRadio');
const toggleRedCheckbox = document.getElementById('toggleRedPins');
const togglePinkCheckbox = document.getElementById('togglePinkPins');
const toggleBlackCheckbox = document.getElementById('toggleBlackPins'); // New
const togglePurpleCheckbox = document.getElementById('togglePurplePins');

let pins = [];
let redPinsVisible = true;
let pinkPinsVisible = true;
let blackPinsVisible = true; // New
let purplePinsVisible = true;

function migrateFromUrlToLocalStorage() {
    const urlParams = new URLSearchParams(window.location.search)

    if(urlParams.has('blackPins') || urlParams.has('redPins')
            || urlParams.has('pinkPins') || urlParams.has('purplePins')) {
        let message = localStorage.getItem('currentRoutes').length ?
                'Routes are now stored on your device.  Would you like to overwrite your existing routes with the ones in the URL?' :
                'Routes are now stored on your device.  Routes stored in the URL will now be migrated to your device and removed from the URL.'
        if(confirm(message)) {
            document.getElementById('import-tool').style.display = 'flex'
            for(let activeTool of document.getElementsByClassName('active-tool')) {
                activeTool.style.display = 'none'
            }

            let urlPins = getPinsFromURL()
            const rect = backgroundImage.getBoundingClientRect();
            pins = urlPins = urlPins.map(pin => {
                pin.x =  pin.x / rect.width
                pin.y =  pin.y / rect.height
                return pin
            })

            const calibratePins = () => {
                let scale = parseFloat(document.getElementById('migration-scale').value)
                let xOffset = parseFloat(document.getElementById('migration-x-offset').value)
                let yOffset = parseFloat(document.getElementById('migration-y-offset').value)
                pins = urlPins.map(pin => {
                    return {
                        x: (pin.x * scale) + xOffset,
                        y: (pin.y * scale) + yOffset,
                        color: pin.color
                    }
                })
                renderPins()
            }

            document.getElementById('migration-scale').addEventListener('change', calibratePins)
            document.getElementById('migration-x-offset').addEventListener('change', calibratePins)
            document.getElementById('migration-y-offset').addEventListener('change', calibratePins)
            document.getElementById('migration-import').addEventListener('click', () => {
                saveCurrentRoutes()

                urlParams.delete('blackPins')
                urlParams.delete('redPins')
                urlParams.delete('pinkPins')
                urlParams.delete('purplePins')
                window.location.search = urlParams

                document.getElementById('import-tool').style.display = 'none'
                for(let activeTool of document.getElementsByClassName('active-tool')) {
                    activeTool.style.display = undefined
                }
            })

            renderPins()
        }
    }
}

// Function to parse pins from the URL
function getPinsFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const blackPinsParam = urlParams.get('blackPins');
    const redPinsParam = urlParams.get('redPins');
    const pinkPinsParam = urlParams.get('pinkPins');
    const purplePinsParam = urlParams.get('purplePins');
    const loadedPins = [];

    if (blackPinsParam) {
        blackPinsParam.split(';').forEach(pinStr => {
            const coords = pinStr.split(',').map(Number);
            if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                loadedPins.push({ x: coords[0], y: coords[1], color: 'black' });
            }
        });
    }

    if (redPinsParam) {
        redPinsParam.split(';').forEach(pinStr => {
            const coords = pinStr.split(',').map(Number);
            if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                loadedPins.push({ x: coords[0], y: coords[1], color: 'red' });
            }
        });
    }

    if (pinkPinsParam) {
        pinkPinsParam.split(';').forEach(pinStr => {
            const coords = pinStr.split(',').map(Number);
            if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                loadedPins.push({ x: coords[0], y: coords[1], color: 'pink' });
            }
        });
    }

    if (purplePinsParam) {
        purplePinsParam.split(';').forEach(pinStr => {
            const coords = pinStr.split(',').map(Number);
            if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                loadedPins.push({ x: coords[0], y: coords[1], color: 'purple' });
            }
        });
    }

    return loadedPins
}

// Function to update the URL with the current pins
function updateURL() {
    const redPinCoords = pins.filter(pin => pin.color === 'red').map(pin => `${pin.x},${pin.y}`).join(';');
    const pinkPinCoords = pins.filter(pin => pin.color === 'pink').map(pin => `${pin.x},${pin.y}`).join(';');
    const blackPinCoords = pins.filter(pin => pin.color === 'black').map(pin => `${pin.x},${pin.y}`).join(';'); // New
    const purplePinCoords = pins.filter(pin => pin.color === 'purple').map(pin => `${pin.x},${pin.y}`).join(';');

    const newURL = new URL(window.location.href);
    newURL.searchParams.set('redPins', redPinCoords);
    newURL.searchParams.set('pinkPins', pinkPinCoords);
    newURL.searchParams.set('blackPins', blackPinCoords);
    newURL.searchParams.set('purplePins', purplePinCoords);
    window.history.pushState({}, '', newURL);
}

function saveCurrentRoutes() {
    localStorage.setItem('currentRoutes', JSON.stringify(pins))
}

function load() {
    pins = JSON.parse(localStorage.getItem('currentRoutes')) || []
    renderPins()
}

function archiveSet(setColor) {
    if(!pins.some(route => route.color === setColor)) {
        alert(`No ${setColor} routes to archive`)
        return
    }
    if(!confirm(`Are you sure you want to archive all ${setColor} routes?`)) {
        return
    }
    routeSets = Object.groupBy(pins, ({color}) => color === setColor ? 'archive' : 'current')

    // Save archived routes
    let archivedRoutes = JSON.parse(localStorage.getItem('archivedRoutes')) || {}
    if(!archivedRoutes[setColor]) {
        archivedRoutes[setColor] = []
    }
    archivedRoutes[setColor].push(routeSets.archive)
    localStorage.setItem('archivedRoutes', JSON.stringify(archivedRoutes))

    // Update current pins (after archiving just in case something goes wrong)
    pins = routeSets.current || []
    saveCurrentRoutes()

    renderPins()
}

function undoLastPin() {
    if (pins.length > 0) {
        pins.pop(); // Remove the last element from the pins array
        saveCurrentRoutes();
        renderPins();
    } else {
        alert("No pins to undo.");
    }
}

// Function to copy the current link to the clipboard
function copyCurrentLink() {
    navigator.clipboard.writeText(window.location.href)
        .then(() => {
            // Show the notification
            copyNotification.classList.add('show');
            // Hide the notification after a short delay
            setTimeout(() => {
                copyNotification.classList.remove('show');
            }, 1500);
        })
        .catch(err => {
            console.error('Failed to copy link: ', err);
            alert('Failed to copy link to clipboard. Please try manually.');
        });
}

// Function to create a pin element
function createPinElement(pin) {
    const pinElement = document.createElement('div');
    pinElement.classList.add('pin', `pin-${pin.color}`);
    const rect = backgroundImage.getBoundingClientRect();
    pinElement.style.left = `${rect.width * pin.x}px`;
    pinElement.style.top = `${rect.height * pin.y}px`;
    return pinElement;
}

// Function to render the pins on the image
function renderPins() {
    pinContainer.innerHTML = ''; // Clear existing pins
    pins.forEach(pin => {
        if ((pin.color === 'red' && redPinsVisible) ||
            (pin.color === 'pink' && pinkPinsVisible) ||
            (pin.color === 'purple' && purplePinsVisible) ||
            (pin.color === 'black' && blackPinsVisible)) { // New
            const pinElement = createPinElement(pin);
            pinContainer.appendChild(pinElement);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Event listener for clicking on the image to place a pin
    backgroundImage.addEventListener('click', (event) => {
        const rect = backgroundImage.getBoundingClientRect();
        // Store as ratio of image size because screen size can change with rotation / between devices
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;

        // Determine the selected pin color
        let selectedColor = 'red'; // Default to red if no selection
        if (pinkPinRadio.checked) {
            selectedColor = 'pink';
        } else if (blackPinRadio.checked) { // New
            selectedColor = 'black';
        } else if (purplePinRadio.checked) {
            selectedColor = 'purple';
        }

        // Check if the selected color is currently visible before adding a new pin
        let shouldAddPin = false;
        if (selectedColor === 'red' && redPinsVisible) {
            shouldAddPin = true;
        } else if (selectedColor === 'pink' && pinkPinsVisible) {
            shouldAddPin = true;
        } else if (selectedColor === 'black' && blackPinsVisible) { // New
            shouldAddPin = true;
        } else if (selectedColor === 'purple' && purplePinsVisible) {
            shouldAddPin = true;
        }

        if (shouldAddPin) {
            const newPin = { x: x, y: y, color: selectedColor };
            pins.push(newPin);
            renderPins();
            saveCurrentRoutes();
        }
    });

    window.addEventListener('resize', renderPins)

    // Event listeners for the visibility toggle switches
    toggleRedCheckbox.addEventListener('change', () => {
        redPinsVisible = toggleRedCheckbox.checked;
        renderPins();
    });

    togglePinkCheckbox.addEventListener('change', () => {
        pinkPinsVisible = togglePinkCheckbox.checked;
        renderPins();
    });

    toggleBlackCheckbox.addEventListener('change', () => {
        blackPinsVisible = toggleBlackCheckbox.checked;
        renderPins();
    });

    togglePurpleCheckbox.addEventListener('change', () => {
        purplePinsVisible = togglePurpleCheckbox.checked;
        renderPins();
    });

    archiveBlackSetBtn.addEventListener('click', () => archiveSet('black'));
    archiveRedSetBtn.addEventListener('click', () => archiveSet('red'));
    archivePinkSetBtn.addEventListener('click', () => archiveSet('pink'));
    archivePurpleSetBtn.addEventListener('click', () => archiveSet('purple'));

    // Event listener for the undo button
    undoPinButton.addEventListener('click', undoLastPin);

    // Event listener for the copy link button
    copyLinkButton.addEventListener('click', copyCurrentLink);

    load();

    migrateFromUrlToLocalStorage()

    // Initialize visibility based on checkbox state
    redPinsVisible = toggleRedCheckbox.checked;
    pinkPinsVisible = togglePinkCheckbox.checked;
    blackPinsVisible = toggleBlackCheckbox.checked; // New
    purplePinsVisible = togglePurpleCheckbox.checked;
    renderPins();
});