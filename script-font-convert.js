document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.querySelector('.drop-zone');
    const downloadBtn = document.getElementById('downloadBtn');
    const formatSelect = document.getElementById('format');
    const convertBtn = document.getElementById('convertBtn');
    const sampleTexts = document.querySelectorAll('.sample-text');

    let currentFont = null;
    let fontName = '';
    let fontUrl = '';

    // Handle font file selection
    const handleFileSelect = (file) => {
        const validExtensions = ['.ttf', '.otf', '.woff', '.woff2'];
        const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        
        if (!validExtensions.includes(fileExt)) {
            showAlert('Please select a valid font file (TTF, OTF, WOFF, WOFF2)!', 'danger');
            return;
        }

        currentFont = file;
        fontName = file.name.split('.')[0];
        
        // Create a font URL
        fontUrl = URL.createObjectURL(file);
        
        // Create a new @font-face rule
        const fontFace = `@font-face {
            font-family: '${fontName}';
            src: url('${fontUrl}') format('${getFontFormat(file.name)}');
        }`;
        
        // Add the @font-face to a style element
        const style = document.createElement('style');
        style.innerHTML = fontFace;
        document.head.appendChild(style);
        
        // Apply the font to preview elements
        sampleTexts.forEach(text => {
            text.style.fontFamily = `'${fontName}', sans-serif`;
        });
        
        downloadBtn.style.display = 'none';
        showAlert('Font loaded successfully! Preview available.', 'success');
    };

    // Helper function to detect font format from file extension
    function getFontFormat(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        switch(ext) {
            case 'ttf': return 'truetype';
            case 'otf': return 'opentype';
            case 'woff': return 'woff';
            case 'woff2': return 'woff2';
            case 'eot': return 'embedded-opentype';
            case 'svg': return 'svg';
            default: return ext;
        }
    }

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

    // Convert font function
    convertBtn.addEventListener('click', () => {
        if (!currentFont) {
            showAlert('Please select a font file first!', 'danger');
            return;
        }

        const targetFormat = formatSelect.value;
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const fontData = e.target.result;
            const blob = new Blob([fontData], { type: `font/${targetFormat}` });
            
            const url = URL.createObjectURL(blob);
            downloadBtn.href = url;
            downloadBtn.download = `${fontName}.${targetFormat}`;
            downloadBtn.style.display = 'inline-block';
            
            // Update preview with new font if conversion is to a different format
            if (getFontFormat(currentFont.name) !== targetFormat) {
                const newFontUrl = url;
                const newFontFace = `@font-face {
                    font-family: '${fontName}-converted';
                    src: url('${newFontUrl}') format('${targetFormat}');
                }`;
                
                const style = document.createElement('style');
                style.innerHTML = newFontFace;
                document.head.appendChild(style);
                
                sampleTexts.forEach(text => {
                    text.style.fontFamily = `'${fontName}-converted', sans-serif`;
                });
            }
            
            showAlert(`Font converted to ${targetFormat.toUpperCase()} successfully!`, 'success');
        };
        
        reader.onerror = function() {
            showAlert('Error converting font. Please try again.', 'danger');
        };
        
        reader.readAsArrayBuffer(currentFont);
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
