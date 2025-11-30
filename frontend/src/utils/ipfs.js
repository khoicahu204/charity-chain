// IPFS Utility Functions using Pinata

// Pinata Public Gateway
const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

/**
 * Upload file (image or document) to IPFS via Pinata API
 * @param {File} file - File to upload
 * @param {string} pinataJWT - Pinata JWT token
 * @returns {Promise<string>} - IPFS CID (hash)
 */
export async function uploadImageToPinata(file, pinataJWT) {
    if (!pinataJWT) {
        throw new Error("Pinata JWT token is required");
    }

    const formData = new FormData();
    formData.append('file', file);

    const metadata = JSON.stringify({
        name: file.name,
    });
    formData.append('pinataMetadata', metadata);

    const options = JSON.stringify({
        cidVersion: 0,
    });
    formData.append('pinataOptions', options);

    try {
        const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${pinataJWT}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Pinata upload failed: ${response.statusText}`);
        }

        const result = await response.json();
        return result.IpfsHash;
    } catch (error) {
        console.error("Error uploading to Pinata:", error);
        throw error;
    }
}

/**
 * Get IPFS URL from CID
 * @param {string} cid - IPFS CID
 * @returns {string} - Full IPFS gateway URL
 */
export function getIPFSUrl(cid) {
    if (!cid || cid === "") {
        return null;
    }
    return `${IPFS_GATEWAY}${cid}`;
}

/**
 * Validate image file
 * @param {File} file - File to validate
 * @returns {Object} - {valid: boolean, error: string}
 */
export function validateImageFile(file) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (!file) {
        return { valid: false, error: "No file selected" };
    }

    if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed." };
    }

    if (file.size > maxSize) {
        return { valid: false, error: "File size exceeds 5MB limit." };
    }

    return { valid: true, error: null };
}

/**
 * Validate document file
 * @param {File} file - File to validate
 * @returns {Object} - {valid: boolean, error: string}
 */
export function validateDocumentFile(file) {
    const maxSize = 10 * 1024 * 1024; // 10MB for documents
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!file) {
        return { valid: false, error: "No file selected" };
    }

    if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: "Invalid file type. Only PDF, DOC, and DOCX are allowed." };
    }

    if (file.size > maxSize) {
        return { valid: false, error: "File size exceeds 10MB limit." };
    }

    return { valid: true, error: null };
}

/**
 * Get file icon emoji based on extension
 * @param {string} filename - Filename
 * @returns {string} - Emoji icon
 */
export function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    if (ext === 'pdf') return '📄';
    if (ext === 'doc' || ext === 'docx') return '📝';
    return '📎';
}
