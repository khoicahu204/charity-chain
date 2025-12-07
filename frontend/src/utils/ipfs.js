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

/**
 * Upload JSON metadata to IPFS via Pinata
 * @param {Object} jsonData - JSON object to upload
 * @param {string} pinataJWT - Pinata JWT token
 * @returns {Promise<string>} - IPFS CID (hash)
 */
export async function uploadJSONToPinata(jsonData, pinataJWT) {
    if (!pinataJWT) {
        throw new Error("Pinata JWT token is required");
    }

    if (!jsonData || typeof jsonData !== 'object') {
        throw new Error("Invalid JSON data");
    }

    try {
        // Convert JSON to Blob
        const jsonBlob = new Blob([JSON.stringify(jsonData, null, 2)], {
            type: 'application/json'
        });

        const formData = new FormData();
        formData.append('file', jsonBlob, 'metadata.json');

        const metadata = JSON.stringify({
            name: 'campaign-metadata.json',
        });
        formData.append('pinataMetadata', metadata);

        const options = JSON.stringify({
            cidVersion: 0,
        });
        formData.append('pinataOptions', options);

        const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${pinataJWT}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Pinata JSON upload failed: ${response.statusText}`);
        }

        const result = await response.json();
        return result.IpfsHash;
    } catch (error) {
        console.error("Error uploading JSON to Pinata:", error);
        throw error;
    }
}

/**
 * Fetch JSON metadata from IPFS
 * @param {string} cid - IPFS CID
 * @returns {Promise<Object>} - Parsed JSON object
 */
export async function fetchJSONFromIPFS(cid) {
    if (!cid || cid === "") {
        throw new Error("Invalid IPFS CID");
    }

    try {
        const url = getIPFSUrl(cid);
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch JSON from IPFS: ${response.statusText}`);
        }

        const jsonData = await response.json();
        return jsonData;
    } catch (error) {
        console.error("Error fetching JSON from IPFS:", error);
        throw error;
    }
}

/**
 * Validate metadata JSON structure
 * @param {Object} metadata - Metadata object
 * @returns {Object} - {valid: boolean, error: string}
 */
export function validateMetadata(metadata) {
    if (!metadata || typeof metadata !== 'object') {
        return { valid: false, error: "Metadata must be an object" };
    }

    // Required fields
    const requiredFields = ['version', 'name', 'description'];
    for (const field of requiredFields) {
        if (!metadata[field]) {
            return { valid: false, error: `Missing required field: ${field}` };
        }
    }

    // Validate version format
    if (typeof metadata.version !== 'string') {
        return { valid: false, error: "Version must be a string" };
    }

    // Validate name and description
    if (typeof metadata.name !== 'string' || metadata.name.length > 100) {
        return { valid: false, error: "Name must be a string with max 100 characters" };
    }

    if (typeof metadata.description !== 'string' || metadata.description.length > 500) {
        return { valid: false, error: "Description must be a string with max 500 characters" };
    }

    // Validate optional fields if present
    if (metadata.tags && !Array.isArray(metadata.tags)) {
        return { valid: false, error: "Tags must be an array" };
    }

    if (metadata.milestones && !Array.isArray(metadata.milestones)) {
        return { valid: false, error: "Milestones must be an array" };
    }

    return { valid: true, error: null };
}

