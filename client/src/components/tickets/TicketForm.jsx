import React, { useState } from 'react';
import { Send } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import RichTextEditor from '../common/RichTextEditor';
import FileUpload from '../common/FileUpload';

import { getDepartments } from '@/services/departmentService';

const priorities = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' }
];

const TicketForm = ({ onSubmit, isLoading }) => {
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    departmentId: '',
    priority: 'MEDIUM',
    description: '',
    attachments: []
  });

  React.useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await getDepartments();
        const deps = response.data || response.departments || [];
        setDepartments(deps);
        if (deps.length > 0) {
          setFormData(prev => ({ ...prev, departmentId: deps[0].id }));
        }
      } catch (err) {
        console.error('Failed to fetch departments', err);
      }
    };
    fetchDepartments();
  }, []);

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

    // Prepare payload
    const payload = {
      title: formData.title, // Strict mapping to ensure 'title' key
      departmentId: formData.departmentId || undefined,
      priority: formData.priority,
      description: formData.description
    };

    // Remove attachments from payload (handled separately or ignored for now)
    delete payload.attachments;

    onSubmit(payload);
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
          label="Department"
          name="departmentId"
          options={departments.map(d => ({ value: d.id, label: d.name }))}
          value={formData.departmentId}
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
