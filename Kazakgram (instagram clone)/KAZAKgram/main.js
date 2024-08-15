document.addEventListener('DOMContentLoaded', () => {
    // Login handling (if needed)
    if (window.location.pathname.endsWith('/login.html')) {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', function(event) {
                event.preventDefault(); // Prevent traditional form submission
                const username = document.getElementById('username').value;
                if (username) {
                    // Store username in session storage
                    sessionStorage.setItem('username', username);
                    // Redirect to feed.html
                    window.location.href = 'FEED/feed.html';
                } else {
                    alert('Please enter a username');
                }
            });
        }
    }

    // Upload handling
    if (window.location.pathname.endsWith('upload.html')) {
        const username = sessionStorage.getItem('username');
        const form = document.querySelector('.input');
        const fileInput = document.getElementById('uploadimage');
        const previewImage = document.getElementById('preview-image');
        const titleInput = document.getElementById('title');

        // Make the upload image clickable to trigger the file input
        previewImage.addEventListener('click', () => {
            fileInput.click();
        });

        // Handle image preview
        if (fileInput) {
            fileInput.addEventListener('change', function(event) {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        previewImage.src = e.target.result;
                    }
                    reader.readAsDataURL(file); // This reads the file as a Data URL
                }
            });
        }

        // Handle form submission
        if (form) {
            form.addEventListener('submit', function(event) {
                event.preventDefault();

                const title = titleInput.value;
                const file = fileInput.files[0];

                if (!title) {
                    alert('Please enter a title');
                    return;
                }

                if (!file) {
                    alert('Please select an image');
                    return;
                }

                const reader = new FileReader();
                reader.onloadend = function() {
                    const base64Image = reader.result.split(',')[1]; // Extract Base64 data

                    const postData = {
                        bild: base64Image, // Base64-encoded image data
                        titel: title,
                        user: username
                    };

                    fetch('http://212.132.116.39:80/posts', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(postData)
                    })
                    .then(response => response.json())
                    .then(data => {
                        console.log('Upload response:', data);
                        alert('Upload successful');
                        form.reset();
                        previewImage.src = "../images/upload.png"; // Reset preview image
                    })
                    .catch(error => {
                        alert('Error uploading file');
                        console.error('Upload error:', error);
                    });
                }

                reader.readAsDataURL(file); // Convert the image to Base64
            });
        }
    }

    // Feed handling
    if (window.location.pathname.endsWith('feed.html')) {
        fetch("http://212.132.116.39:80/posts", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })
        .then((response) => response.json())
        .then((data) => {
            console.log('Feed data:', data);
            let feed_container = document.getElementById('feed-container');
            const excludeId = '7cb0612d-6e49-4a53-8435-a2a83395236f';

            // Filter out the post with the specified id
            const filteredData = data.filter(post => post.id !== excludeId);

            for (let element of filteredData) {
                const card = createCard(element.bild, element.user, element.titel, element.id);
                feed_container.appendChild(card);
            }

            // Fetch and update likes after cards are created
            fetchLikes();

            const overlay = document.getElementById('overlay');
            const overlayImage = document.getElementById('overlayImage');
            const images = document.querySelectorAll('.card-image');

            images.forEach(image => {
                image.addEventListener('click', () => {
                    overlayImage.src = image.src;
                    overlay.classList.add('active');
                });
            });

            overlay.addEventListener('click', () => {
                overlay.classList.remove('active');
            });

        })
        .catch((error) => {
            alert("Fehler beim Abrufen der Bilder.");
            console.error("Fehler:", error);
        });
    }
});

function fetchLikes() {
    fetch('http://212.132.116.39:80/likes', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => response.json())
    .then(data => {
        console.log('Likes data:', data);
        let cards = document.querySelectorAll('.card');
        
        cards.forEach(card => {
            const cardId = card.dataset.id;
            const filteredLikes = data.filter(like => like.bildID === cardId);
            const likeCount = filteredLikes.length;
            const likeContainer = card.querySelector('.like-container');
            if (likeContainer) {
                likeContainer.textContent = `⭐ ${likeCount} Steppe Stars`;
            }
        });
    })
    .catch(error => {
        console.error('Error fetching likes:', error);
        alert('Error fetching likes.');
    });
}

function createCard(image, user, title, id, likeCount = 0) {
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.id = id;

    card.innerHTML = `
    <a href="detailansicht.html?id=${id}" class="card-link"><div class="lupe">🔍</div></a>
    <div class="author">${user}</div>
    <img src="data:image/png;base64,${image}" alt="${title}" class="card-image">
    <h2>${title}</h2> 
    <div class="like-container" style="cursor: pointer;">⭐ ${likeCount} Steppe Stars</div>`;

    // Add click event listener to the like-container
    const likeContainer = card.querySelector('.like-container');
    likeContainer.addEventListener('click', () => {
        handleLikeClick(id, likeContainer);
    });

    return card;
}

function handleLikeClick(bildID, likeContainer) {
    const username = sessionStorage.getItem('username');
    if (!username) {
        alert('Please log in to like posts.');
        return;
    }

    const postData = {
        user: username,
        bildID: bildID
    };

    fetch('http://212.132.116.39:80/likes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Like response:', data);
        // Increment the like count in the UI
        const currentCount = parseInt(likeContainer.textContent.match(/\d+/)[0]);
        likeContainer.textContent = `⭐ ${currentCount + 1} Steppe Stars`;
    })
    .catch(error => {
        console.error('Error liking post:', error);
        alert('Error liking post.');
    });
}
