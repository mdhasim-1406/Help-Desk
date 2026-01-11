import React, { useState } from 'react';
import { Send } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import RichTextEditor from '../common/RichTextEditor';
import FileUpload from '../common/FileUpload';

const categories = [
  { value: 'Technical Support', label: 'Technical Support' },
  { value: 'Billing', label: 'Billing' },
  { value: 'Feature Request', label: 'Feature Request' },
  { value: 'Bug Report', label: 'Bug Report' },
  { value: 'Account Access', label: 'Account Access' },
  { value: 'Other', label: 'Other' }
];

const priorities = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
];

const TicketForm = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Technical Support',
    priority: 'medium',
    description: '',
    attachments: []
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDescriptionChange = (content) => {
    setFormData(prev => ({ ...prev, description: content }));
    if (errors.description) {
      setErrors(prev => ({ ...prev, description: '' }));
    }
  };

  const handleFilesChange = (files) => {
    setFormData(prev => ({
      ...prev,
      attachments: files
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Simple validation
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Please provide a descriptive title.';
    if (!formData.description.trim()) newErrors.description = 'Please describe your issue in detail.';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Input
            label="Ticket Subject"
            name="title"
            placeholder="e.g., Unable to login to my account"
            value={formData.title}
            onChange={handleChange}
            error={errors.title}
            disabled={isLoading}
            required
          />
        </div>

        <Select
          label="Category"
          name="category"
          options={categories}
          value={formData.category}
          onChange={handleChange}
          disabled={isLoading}
        />

        <Select
          label="Priority"
          name="priority"
          options={priorities}
          value={formData.priority}
          onChange={handleChange}
          disabled={isLoading}
        />

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Detailed Description <span className="text-red-500">*</span>
          </label>
          <RichTextEditor
            content={formData.description}
            onChange={handleDescriptionChange}
            placeholder="Please provide as much information as possible..."
            error={errors.description}
            editable={!isLoading}
            showCharCount={true}
            minHeight="250px"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Attachments (Optional)
          </label>
          <FileUpload
            files={formData.attachments}
            onChange={handleFilesChange}
            maxFiles={5}
            disabled={isLoading}
            showPreview={true}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={isLoading}
          icon={Send}
        >
          Create Ticket
        </Button>
      </div>
    </form>
  );
};

export default TicketForm;
