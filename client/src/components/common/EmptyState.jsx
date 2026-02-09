import Button from './Button';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}) {
  return (
    <div className="text-center py-12">
      {Icon && (
        <Icon className="mx-auto h-12 w-12 text-slate-400" />
      )}
      <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>
      )}
      {action && (
        <div className="mt-6">
          <Button
            onClick={action.onClick}
            variant="primary"
          >
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}
