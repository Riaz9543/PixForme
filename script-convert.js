document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.querySelector('.drop-zone');
    const preview = document.getElementById('preview');
    const downloadBtn = document.getElementById('downloadBtn');
    const formatSelect = document.getElementById('format');
    const convertBtn = document.getElementById('convertBtn');

    let currentFile = null;

    // Handle file selection
    const handleFileSelect = (file) => {
        if (!file.type.match('image.*')) {
            showAlert('Please select an image file!', 'danger');
            return;
        }

        currentFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.src = e.target.result;
            downloadBtn.style.display = 'none';
            showAlert('Image loaded successfully!', 'success');
        };
        reader.readAsDataURL(file);
    };

    // Drag and drop handlers
    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFileSelect(e.target.files[0]);
        }
    });

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
        if (e.dataTransfer.files.length) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });

    // Convert image function
    convertBtn.addEventListener('click', () => {
        if (!currentFile) {
            showAlert('Please select an image first!', 'danger');
            return;
        }

        const format = formatSelect.value;
        const img = new Image();
        
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                downloadBtn.href = url;
                downloadBtn.download = `converted.${format}`;
                downloadBtn.style.display = 'inline-block';
                showAlert(`Image converted to ${format.toUpperCase()} successfully!`, 'success');
            }, `image/${format}`, 0.9);
        };
        
        img.onerror = function() {
            showAlert('Error loading image. Please try another file.', 'danger');
        };
        
        img.src = URL.createObjectURL(currentFile);
    });

    // Show alert function
    function showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
        alertDiv.role = 'alert';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            alertDiv.classList.remove('show');
            setTimeout(() => alertDiv.remove(), 150);
        }, 3000);
    }
});
