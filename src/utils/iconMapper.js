import { 
  Play, 
  Database, 
  Mail, 
  Webhook, 
  Clock, 
  Filter, 
  Code, 
  FileText,
  Settings,
  Zap,
  Terminal
} from 'lucide-react';

// Icon string'lerini React component'lere map eden utility
export const iconMapper = {
  'Play': Play,
  'Database': Database,
  'Mail': Mail,
  'Webhook': Webhook,
  'Clock': Clock,
  'Filter': Filter,
  'Code': Code,
  'FileText': FileText,
  'Settings': Settings,
  'Zap': Zap,
  'Terminal': Terminal
};

export const getIconComponent = (iconName) => {
  return iconMapper[iconName] || Settings;
};