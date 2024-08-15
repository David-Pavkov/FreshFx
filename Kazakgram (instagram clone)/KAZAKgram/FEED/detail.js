let komment_reset = document.getElementById("kommentreset");
let komment_area = document.getElementById("komment-area");

komment_reset.addEventListener("click", (e) => {
    komment_area.style.width = "350px";
    komment_area.style.height = "60px";

    console.log("test");
});

// Feed handling
function createCard(image, user, title, likes = 0) {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
    <div class="author">${user}</div>
    <img src="data:image/png;base64,${image}" alt="${title}" class="card-image">
    <h2>${title}</h2>
    <h2 class="like-container"></h2>`;
    return card;
}

const urlParams = new URLSearchParams(window.location.search);
const bildID = urlParams.get('id');
const username = sessionStorage.getItem('username');
let likeCount = 0;

document.addEventListener('DOMContentLoaded', () => {
    const submitButton = document.getElementById('submit-comment');
    const kommentArea = document.getElementById('komment-area');

    submitButton.addEventListener('click', () => {
        const kommentar = kommentArea.value.trim();

        if (!username) {
            alert('User not logged in. Please log in first.');
            return;
        }

        if (!kommentar) {
            alert('Comment cannot be empty.');
            return;
        }

        if (!bildID) {
            alert('BildID is missing.');
            return;
        }

        fetch('http://212.132.116.39:80/comments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                kommentar: kommentar,
                user: username,
                bildID: bildID,
            }),
        })
            .then(response => response.json())
            .then(data => {
                console.log('Comment submitted:', data);
                alert("Comment submitted successfully.");
                location.reload();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error submitting comment.');
            });
    });

    if (window.location.pathname.endsWith('detailansicht.html')) {
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

                const urlParams = new URLSearchParams(window.location.search);
                const id = urlParams.get('id');

                data = data.filter((object) => {
                    return object.id == id;
                });

                for (let element of data) {
                    const card = createCard(element.bild, element.user, element.titel);
                    feed_container.appendChild(card);
                }

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

                fetchComments();
                fetchLikes();
            })
            .catch((error) => {
                alert("Fehler beim Abrufen der Bilder.");
                console.error("Fehler:", error);
            });
    }
});

function fetchComments() {
    fetch('http://212.132.116.39:80/comments', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(response => response.json())
        .then(data => {
            let comment_container = document.getElementById("comment-container");
            comment_container.innerHTML = '<h2>Comments</h2>';

            // Filter comments to show only those related to the current bildID
            const filteredComments = data.filter(comment => comment.bildID === bildID);

            // Display filtered comments
            filteredComments.forEach(comment => {
                const commentDiv = document.createElement('div');
                commentDiv.className = 'comment-item';
                commentDiv.innerHTML = `
                <div class="comment-author">${comment.user}</div>
                <div class="comment-text">${comment.kommentar}</div>
                <div class="comment-timestamp">${new Date(comment.create_timestamp).toLocaleString()}</div>
            `;
                comment_container.appendChild(commentDiv);
            });

            // Set up the toggle button if there are comments
            setupCommentsToggle();
        })
        .catch(error => {
            console.error('Error fetching comments:', error);
            alert('Error fetching comments.');
        });
}

function fetchLikes() {
    if (!bildID) {
        console.error('BildID is missing.');
        alert('BildID is missing.');
        return;
    }

    fetch('http://212.132.116.39:80/likes', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(response => response.json())
        .then(data => {
            let likeHeader = document.querySelector('.like-container');
            if (!likeHeader) {
                console.error('Error: like-container element not found.');
                return;
            }

            const filteredLikes = data.filter(like => like.bildID === bildID);
            likeCount = filteredLikes.length;
            likeHeader.textContent = `⭐ ${likeCount} Steppe Stars`;

            if (likeCount === 0) {
                likeHeader.textContent = 'No likes yet';
            }

            likeHeader.addEventListener('click', () => {
                addLike(username, bildID, likeHeader);
            });
        })
        .catch(error => {
            console.error('Error fetching likes:', error);
            alert('Error fetching likes.');
        });
}

function addLike(username, bildID, likeHeader) {
    if (!username) {
        alert('User not logged in. Please log in first.');
        return;
    }

    fetch('http://212.132.116.39:80/likes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user: username,
            bildID: bildID,
        }),
    })
        .then(response => response.json())
        .then(data => {
            console.log('Like added:', data);
            likeCount++;
            likeHeader.textContent = `⭐ ${likeCount} Steppe Stars`;
        })
        .catch(error => {
            console.error('Error adding like:', error);
            alert('Error adding like.');
        });
}

// Function to create and show the toggle button if there are comments
function setupCommentsToggle() {
    const commentContainer = document.getElementById('comment-container');
    const comments = commentContainer.querySelectorAll('.comment-item');

    if (comments.length > 0) {
        // Create the toggle button
        const toggleCommentsButton = document.createElement('button');
        toggleCommentsButton.id = 'toggle-comments';
        toggleCommentsButton.className = 'toggle-comments-button';
        toggleCommentsButton.textContent = 'Hide Comments';

        // Insert the button before the comments container
        const mainContent = document.querySelector('.main-content');
        mainContent.insertBefore(toggleCommentsButton, commentContainer);

        // Set up the toggle functionality
        let commentsVisible = true; // Track visibility state

        toggleCommentsButton.addEventListener('click', () => {
            if (commentsVisible) {
                commentContainer.style.display = 'none'; // Hide comments
                toggleCommentsButton.textContent = 'Show Comments'; // Change button text
            } else {
                commentContainer.style.display = 'block'; // Show comments
                toggleCommentsButton.textContent = 'Hide Comments'; // Change button text
            }
            commentsVisible = !commentsVisible; // Toggle the visibility state
        });
    }
}
