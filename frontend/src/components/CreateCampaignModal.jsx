import React, { useState } from 'react';
import { XCircle, Upload, FileText } from 'lucide-react';
import { validateImageFile, validateDocumentFile } from '../utils/ipfs';

const CreateCampaignModal = ({ onClose, onCreate, uploadingImage, uploadingDocument }) => {
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    category: 'General',
    target: '100',
    duration: '0',
    durationHours: '1'
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }
    setSelectedImage(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleDocumentSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validation = validateDocumentFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }
    setSelectedDocument(file);
  };

  const handleRemoveDocument = () => {
    setSelectedDocument(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate total duration
    const totalHours = Number(newCampaign.duration) * 24 + Number(newCampaign.durationHours);
    if (totalHours <= 0) {
      alert('Total duration must be at least 1 hour!');
      return;
    }

    onCreate(newCampaign, selectedImage, selectedDocument);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto transition-colors duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Start a Campaign</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Campaign Name</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              value={newCampaign.name}
              onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <textarea
              required
              className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 h-24 resize-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              value={newCampaign.description}
              onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
            <select
              className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              value={newCampaign.category}
              onChange={(e) => setNewCampaign({ ...newCampaign, category: e.target.value })}
            >
              <option value="General">General</option>
              <option value="Education">Education</option>
              <option value="Health">Health</option>
              <option value="Environment">Environment</option>
              <option value="Disaster Relief">Disaster Relief</option>
              <option value="Community">Community</option>
            </select>
          </div>
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Campaign Image (Optional)
            </label>

            {!imagePreview ? (
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center hover:border-rose-400 dark:hover:border-rose-400 transition-colors cursor-pointer"
                onClick={() => document.getElementById('imageInput').click()}>
                <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="text-sm text-slate-600 dark:text-slate-400">Click to upload image</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                <input
                  id="imageInput"
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          {/* Document Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Campaign Documents (Optional)
            </label>

            {!selectedDocument ? (
              <div
                className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 text-center hover:border-blue-400 dark:hover:border-blue-400 transition-colors cursor-pointer"
                onClick={() => document.getElementById('documentInput').click()}
              >
                <FileText className="w-6 h-6 mx-auto text-slate-400 mb-2" />
                <p className="text-sm text-slate-600 dark:text-slate-400">Upload PDF or DOC</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Up to 10MB</p>
                <input
                  id="documentInput"
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleDocumentSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{selectedDocument.name}</span>
                  <span className="text-xs text-slate-400">
                    ({(selectedDocument.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveDocument}
                  className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Target (CHT)</label>
              <input
                type="number"
                step="1"
                min="1"
                required
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                value={newCampaign.target}
                onChange={(e) => setNewCampaign({ ...newCampaign, target: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Duration (Days)</label>
              <input
                type="number"
                step="1"
                min="0"
                required
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                value={newCampaign.duration}
                onChange={(e) => setNewCampaign({ ...newCampaign, duration: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Duration (Hours)</label>
              <input
                type="number"
                step="1"
                min="1"
                max="23"
                required
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                value={newCampaign.durationHours}
                onChange={(e) => setNewCampaign({ ...newCampaign, durationHours: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <div className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-400">
                Total: {Number(newCampaign.duration) * 24 + Number(newCampaign.durationHours)} hours
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={uploadingImage || uploadingDocument}
            className="w-full bg-rose-500 text-white py-3 rounded-lg font-bold hover:bg-rose-600 transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploadingImage ? 'Uploading Image...' :
              uploadingDocument ? 'Uploading Document...' :
                'Create Campaign'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateCampaignModal;
