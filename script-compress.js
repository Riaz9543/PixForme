document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.querySelector('.drop-zone');
    const originalPreview = document.getElementById('originalPreview');
    const compressedPreview = document.getElementById('compressedPreview');
    const downloadBtn = document.getElementById('downloadBtn');
    const qualitySlider = document.getElementById('quality');
    const qualityValue = document.getElementById('qualityValue');
    const compressBtn = document.getElementById('compressBtn');
    const fileSizeInfo = document.getElementById('fileSizeInfo');
    const originalSizeDisplay = document.getElementById('originalSize');
    const compressedSizeDisplay = document.getElementById('compressedSize');

    let currentFile = null;
    let originalSize = 0;
    let compressedBlob = null;

    // Update quality slider value display
    qualitySlider.addEventListener('input', () => {
        qualityValue.textContent = `${qualitySlider.value}%`;
    });

    // Handle file selection
    const handleFileSelect = (file) => {
        if (!file.type.match('image.*')) {
            showAlert('Please select an image file!', 'danger');
            return;
        }

        currentFile = file;
        originalSize = file.size;
        originalSizeDisplay.textContent = `${(originalSize / 1024).toFixed(2)} KB`;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            originalPreview.src = e.target.result;
            compressedPreview.src = '';
            compressedSizeDisplay.textContent = '0 KB';
            downloadBtn.style.display = 'none';
            fileSizeInfo.textContent = `Original: ${(originalSize / 1024).toFixed(2)} KB | Reduced: 0 KB (0% smaller)`;
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

    // Compress image function
    compressBtn.addEventListener('click', () => {
        if (!currentFile) {
            showAlert('Please select an image first!', 'danger');
            return;
        }

        const quality = qualitySlider.value / 100;
        const img = new Image();
        
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Calculate new dimensions (maintain aspect ratio)
            const maxDimension = 2000;
            let width = img.width;
            let height = img.height;
            
            if (width > height && width > maxDimension) {
                height = (maxDimension / width) * height;
                width = maxDimension;
            } else if (height > maxDimension) {
                width = (maxDimension / height) * width;
                height = maxDimension;
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to Blob with quality
            canvas.toBlob((blob) => {
                compressedBlob = blob;
                const compressedSize = blob.size;
                const compressedUrl = URL.createObjectURL(blob);
                
                compressedPreview.src = compressedUrl;
                compressedSizeDisplay.textContent = `${(compressedSize / 1024).toFixed(2)} KB`;
                
                // Calculate savings percentage
                const savings = 100 - (compressedSize / originalSize * 100);
                fileSizeInfo.textContent = `Original: ${(originalSize / 1024).toFixed(2)} KB | Reduced: ${(compressedSize / 1024).toFixed(2)} KB (${savings.toFixed(1)}% smaller)`;
                
                // Update download button
                downloadBtn.href = compressedUrl;
                downloadBtn.download = `compressed_${Math.round(savings)}percent.jpg`;
                downloadBtn.style.display = 'inline-block';
                
                showAlert(`Image compressed successfully! Size reduced by ${savings.toFixed(1)}%`, 'success');
            }, 'image/jpeg', quality);
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
