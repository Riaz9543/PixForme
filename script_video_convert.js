document.addEventListener('DOMContentLoaded', () => {
    const videoInput = document.getElementById('videoInput');
    const dropZone = document.querySelector('.drop-zone');
    const convertBtn = document.getElementById('convertBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const formatSelect = document.getElementById('audioFormat');
    const progress = document.getElementById('conversionProgress');
    const videoPreview = document.getElementById('videoPreview');
    
    let mediaRecorder;
    let recordedChunks = [];
    let videoFile = null;
    let audioContext;
    let progressInterval;

    const supportedFormats = ['video/mp4', 'video/webm', 'video/quicktime'];

    // Handle file selection
    function handleVideoSelect(file) {
        if (!file.type.startsWith('video/') || !supportedFormats.includes(file.type)) {
            showAlert('Please select a valid video file (MP4, WebM or MOV)!', 'danger');
            return;
        }

        videoFile = file;
        const videoURL = URL.createObjectURL(file);
        
        // Show video preview
        videoPreview.src = videoURL;
        videoPreview.style.display = 'block';
        videoPreview.muted = false;
        videoPreview.controls = true;
        downloadBtn.classList.add('d-none');
        convertBtn.disabled = false;
        
        showAlert('Video loaded successfully!', 'success');
    }

    // Start conversion process
    function startConversion() {
        if (!videoFile) {
            showAlert('Please select a video first!', 'danger');
            return;
        }

        const videoElement = document.createElement('video');
        videoElement.src = URL.createObjectURL(videoFile);
        videoElement.muted = true; // Required for autoplay
        videoElement.playsInline = true;
        
        videoElement.onloadedmetadata = () => {
            videoElement.play().catch(e => {
                showAlert('Error playing video: ' + e.message, 'danger');
                progress.classList.add('d-none');
            });
            startRecording(videoElement);
        };

        videoElement.onerror = () => {
            showAlert('Error playing video!', 'danger');
            progress.classList.add('d-none');
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
            }
        };
    }

    // Start media recording
    function startRecording(videoElement) {
        // Reset progress UI
        const progressBar = progress.querySelector('.progress-bar');
        progressBar.style.width = '0%';
        progressBar.setAttribute('aria-valuenow', '0');
        progress.querySelector('.progress-text').textContent = '0%';
        document.getElementById('progressPercent').textContent = '0';
        document.getElementById('timeElapsed').textContent = '00:00';
        document.getElementById('timeRemaining').textContent = '00:00';
        
        recordedChunks = [];
        progress.classList.remove('d-none');
        
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const destination = audioContext.createMediaStreamDestination();
            const source = audioContext.createMediaElementSource(videoElement);
            
            // Connect audio nodes properly
            source.connect(audioContext.destination); // For playback
            source.connect(destination); // For recording

            let mimeType = formatSelect.value;
            
            // Handle MP3 format support
            if (mimeType === 'audio/mp3' && !MediaRecorder.isTypeSupported('audio/mpeg')) {
                showAlert('MP3 format not supported in this browser. Using WAV instead.', 'warning');
                mimeType = 'audio/wav';
            }

            mediaRecorder = new MediaRecorder(destination.stream, { 
                mimeType: mimeType,
                audioBitsPerSecond: 128000
            });

            mediaRecorder.ondataavailable = event => {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                clearInterval(progressInterval);
                const audioBlob = new Blob(recordedChunks, { type: mimeType });
                const audioUrl = URL.createObjectURL(audioBlob);
                
                downloadBtn.href = audioUrl;
                downloadBtn.download = `audio-${Date.now()}${getFileExtension(mimeType)}`;
                downloadBtn.classList.remove('d-none');
                
                showAlert('Conversion completed successfully!', 'success');
                progress.classList.add('d-none');
                
                // Clean up
                if (audioContext) {
                    audioContext.close().catch(e => console.error('Error closing audio context:', e));
                }
            };

            mediaRecorder.start();
            
            // Update progress
            progressInterval = updateProgress(videoElement);
            
            // Set timeout as fallback
            const duration = videoElement.duration * 1000 || 60000;
            setTimeout(() => {
                if (mediaRecorder && mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                }
            }, duration);

        } catch (e) {
            console.error('Error:', e);
            showAlert('Conversion error: ' + e.message, 'danger');
            progress.classList.add('d-none');
        }
    }

    // Update progress tracking
    function updateProgress(videoElement) {
        const progressBar = progress.querySelector('.progress-bar');
        const progressText = progress.querySelector('.progress-text');
        const conversionDetails = document.getElementById('conversionDetails');
        const progressPercent = document.getElementById('progressPercent');
        const timeElapsed = document.getElementById('timeElapsed');
        const timeRemaining = document.getElementById('timeRemaining');
        
        // Show details container
        conversionDetails.classList.remove('d-none');
        
        const interval = setInterval(() => {
            if (!videoElement.duration || isNaN(videoElement.currentTime)) return;
            
            const currentTime = videoElement.currentTime;
            const duration = videoElement.duration;
            const percent = Math.min(100, (currentTime / duration) * 100);
            
            // Update progress bar
            progressBar.style.width = `${percent}%`;
            progressBar.setAttribute('aria-valuenow', percent.toFixed(1));
            progressText.textContent = `${percent.toFixed(1)}%`;
            
            // Update detailed progress
            progressPercent.textContent = percent.toFixed(1);
            
            // Calculate time elapsed and remaining
            const elapsedSeconds = currentTime;
            const remainingSeconds = Math.max(0, duration - currentTime);
            
            timeElapsed.textContent = formatTime(elapsedSeconds);
            timeRemaining.textContent = formatTime(remainingSeconds);
            
            // Complete if done
            if (percent >= 100) {
                clearInterval(interval);
            }
        }, 200);
        
        return interval;

        // Helper function to format time as MM:SS
        function formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
    }

    // Get file extension from MIME type
    function getFileExtension(mimeType) {
        switch(mimeType) {
            case 'audio/mp3': return '.mp3';
            case 'audio/wav': return '.wav';
            case 'audio/ogg': return '.ogg';
            case 'audio/webm': return '.webm';
            default: return '.mp3';
        }
    }

    // Event listeners
    dropZone.addEventListener('click', () => videoInput.click());
    
    videoInput.addEventListener('change', (e) => {
        if (e.target.files.length) handleVideoSelect(e.target.files[0]);
    });

    // Drag and drop handlers
    ['dragover', 'dragenter'].forEach(event => {
        dropZone.addEventListener(event, (e) => {
            e.preventDefault();
            dropZone.classList.add('active-drop');
        });
    });

    ['dragleave', 'dragend', 'drop'].forEach(event => {
        dropZone.addEventListener(event, (e) => {
            e.preventDefault();
            dropZone.classList.remove('active-drop');
        });
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        if (e.dataTransfer.files.length) handleVideoSelect(e.dataTransfer.files[0]);
    });

    convertBtn.addEventListener('click', () => {
        showAlert('Conversion started...', 'info');
        startConversion();
    });

    // Initialize with convert button disabled
    convertBtn.disabled = true;

    // Show alert function
    function showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
        alertDiv.setAttribute('role', 'alert');
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.classList.remove('show');
            setTimeout(() => alertDiv.remove(), 150);
        }, 3000);
    }
});