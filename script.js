document.addEventListener('DOMContentLoaded', () => {
    const playerContainer = document.getElementById('player-container');
    const videoPlayer = document.getElementById('video-player');
    const videoJsPlayer = videojs(videoPlayer, {
        autoplay: true,
        controls: true,
        controlBar: {
            fadeIn: true,
            fadeOut: true
        }
    });

    const channelList = document.getElementById('channel-list');
    const channelItems = channelList.querySelectorAll('li');
    const epg = document.getElementById('epg');
    const epgList = document.getElementById('epg-list');
    let currentIndex = 0;
    let closeListTimeout;
    let currentPlayer = null;

    const updateVisualSelection = () => {
        channelItems.forEach((item, index) => {
            if (index === currentIndex) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    };

    const updateVideoSource = () => {
        const selectedItem = channelItems[currentIndex];
        const newSrc = selectedItem.getAttribute('data-src');
        const type = selectedItem.getAttribute('data-type');
        switchPlayer(newSrc, type);
    };

    const switchPlayer = (src, type) => {
        stopCurrentPlayer();
        if (type === 'm3u8') {
            playerContainer.innerHTML = '<video id="video-player" class="video-js vjs-default-skin" controls preload="auto" data-setup=\'{}\'></video>';
            currentPlayer = document.getElementById('video-player');
            const player = videojs(currentPlayer);
            player.src({ src, type: 'application/x-mpegURL' });
            player.ready(() => {
                player.play();
            });
        } else if (type === 'iframe') {
            playerContainer.innerHTML = `<iframe src="${src}" width="640" height="480" allow="autoplay"></iframe>`;
            currentPlayer = playerContainer.querySelector('iframe');
        }
    };

    const stopCurrentPlayer = () => {
        if (currentPlayer) {
            if (currentPlayer.tagName.toLowerCase() === 'video') {
                const player = videojs(currentPlayer);
                player.pause();
                player.dispose();
            } else if (currentPlayer.tagName.toLowerCase() === 'iframe') {
                currentPlayer.remove();
            }
        }
    };

    const startCloseListTimeout = () => {
        clearTimeout(closeListTimeout);
        closeListTimeout = setTimeout(() => {
            channelList.style.left = '-300px';
        }, 4000);
    };

    const loadEPG = (channel) => {
        fetch('epg.json')
            .then(response => response.json())
            .then(data => {
                epgList.innerHTML = '';
                if (data[channel]) {
                    data[channel].forEach(program => {
                        const li = document.createElement('li');
                        li.textContent = `${program.time} - ${program.title}`;
                        epgList.appendChild(li);
                    });
                } else {
                    const li = document.createElement('li');
                    li.textContent = 'No programming information available';
                    epgList.appendChild(li);
                }
            })
            .catch(error => console.error('Error fetching EPG data:', error));
    };

    const updateProgramInfo = () => {
        fetch('epg.json')
            .then(response => response.json())
            .then(data => {
                channelItems.forEach(item => {
                    const channel = item.getAttribute('data-channel');
                    const programInfoElement = item.querySelector('.program-info');
                    if (data[channel] && data[channel].length > 0) {
                        programInfoElement.textContent = data[channel][0].title;
                    } else {
                        programInfoElement.textContent = '';
                    }
                });
            })
            .catch(error => console.error('Error fetching EPG data:', error));
    };

    updateVisualSelection();
    updateProgramInfo();

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            if (channelList.style.left === '0px') {
                updateVideoSource();
                channelList.style.left = '-300px';
            } else {
                channelList.style.left = '0';
                startCloseListTimeout();
            }
        } else if (e.key === 'ArrowDown') {
            if (channelList.style.left === '0px') {
                currentIndex = (currentIndex + 1) % channelItems.length;
                updateVisualSelection();
                startCloseListTimeout();
            }
        } else if (e.key === 'ArrowUp') {
            if (channelList.style.left === '0px') {
                currentIndex = (currentIndex - 1 + channelItems.length) % channelItems.length;
                updateVisualSelection();
                startCloseListTimeout();
            }
        } else if (e.key === 'ArrowRight') {
            if (channelList.style.left === '0px') {
                epg.style.right = '0';
                const selectedChannel = channelItems[currentIndex].getAttribute('data-channel');
                loadEPG(selectedChannel);
            }
        } else if (e.key === 'ArrowLeft') {
            if (epg.style.right === '0px') {
                epg.style.right = '-300px';
            }
        }
    });

    channelItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            currentIndex = index;
            updateVisualSelection();
        });
    });

    channelList.addEventListener('mousemove', startCloseListTimeout);
});
