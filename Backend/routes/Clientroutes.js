const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const clientUpload = require('../middleware/clientUpload');

// Helper function to normalize URLs for comparison
const normalizeUrl = (url) => {
    if (!url) return '';

    // Remove protocol (http://, https://)
    let normalized = url.replace(/^https?:\/\//, '');

    // Remove www.
    normalized = normalized.replace(/^www\./, '');

    // Remove trailing slash
    normalized = normalized.replace(/\/$/, '');

    // Convert to lowercase
    return normalized.toLowerCase();
};

// Create a new client
router.post('/', clientUpload.single('logo'), async (req, res) => {
    try {
        const { companyName, websiteUrl, createdBy } = req.body;

        // Validate createdBy is provided
        if (!createdBy) {
            return res.status(400).json({ message: 'createdBy field is required' });
        }

        // Normalize the incoming URL
        const normalizedUrl = normalizeUrl(websiteUrl);

        // Get all clients to check for duplicate URLs
        const allClients = await Client.find();

        // Check for duplicate company name or normalized URL
        const existingClient = allClients.find(client => {
            const existingNormalizedUrl = normalizeUrl(client.websiteUrl);
            return client.companyName.toLowerCase() === companyName.toLowerCase() ||
                existingNormalizedUrl === normalizedUrl;
        });

        if (existingClient) {
            const isDuplicateName = existingClient.companyName.toLowerCase() === companyName.toLowerCase();
            return res.status(400).json({
                message: isDuplicateName
                    ? 'A client with this Company Name already exists.'
                    : 'A client with this Website URL already exists.'
            });
        }

        // Prepare client data with logo path if file was uploaded
        const clientData = {
            ...req.body,
            logo: req.file ? `uploads/clients/${req.file.filename}` : undefined
        };

        // Parse POCs if it's a JSON string (from FormData)
        if (typeof clientData.pocs === 'string') {
            try {
                clientData.pocs = JSON.parse(clientData.pocs);
            } catch (e) {
                return res.status(400).json({ message: 'Invalid POCs data format' });
            }
        }

        const newClient = new Client(clientData);
        const savedClient = await newClient.save();
        res.status(201).json({ success: true, client: savedClient });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get all clients
// Get all clients with job count
router.get('/', async (req, res) => {
    try {
        const clients = await Client.find()
            .populate('createdBy', 'name email designation')
            .sort({ createdAt: -1 })
            .lean();
        const Job = require('../models/Jobs');
        const jobs = await Job.find({}, 'clientId');

        const clientsWithCount = clients.map(client => {
            const count = jobs.filter(job => job.clientId && job.clientId.toString() === client._id.toString()).length;
            return { ...client, jobCount: count };
        });

        res.json({ success: true, clients: clientsWithCount });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Update a client
router.put('/:id', clientUpload.single('logo'), async (req, res) => {
    try {
        const { companyName, websiteUrl } = req.body;

        // Normalize the incoming URL
        const normalizedUrl = normalizeUrl(websiteUrl);

        // Get all clients except the current one
        const allClients = await Client.find({ _id: { $ne: req.params.id } });

        // Check for duplicate company name or normalized URL
        const existingClient = allClients.find(client => {
            const existingNormalizedUrl = normalizeUrl(client.websiteUrl);
            return client.companyName.toLowerCase() === companyName.toLowerCase() ||
                existingNormalizedUrl === normalizedUrl;
        });

        if (existingClient) {
            const isDuplicateName = existingClient.companyName.toLowerCase() === companyName.toLowerCase();
            return res.status(400).json({
                message: isDuplicateName
                    ? 'A client with this Company Name already exists.'
                    : 'A client with this Website URL already exists.'
            });
        }

        // Prepare update data with logo path if new file was uploaded
        const updateData = {
            ...req.body,
        };

        if (req.file) {
            updateData.logo = `uploads/clients/${req.file.filename}`;
        }

        // Parse POCs if it's a JSON string (from FormData)
        if (typeof updateData.pocs === 'string') {
            try {
                updateData.pocs = JSON.parse(updateData.pocs);
            } catch (e) {
                return res.status(400).json({ message: 'Invalid POCs data format' });
            }
        }

        const updatedClient = await Client.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        );
        res.json({ success: true, client: updatedClient });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a client
router.delete('/:id', async (req, res) => {
    try {
        await Client.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Client deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
