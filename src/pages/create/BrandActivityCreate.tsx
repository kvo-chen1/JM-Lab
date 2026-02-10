import { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { brandPartnershipService, BrandPartnership } from '@/services/brandPartnershipService';
import { brandEventService } from '@/services/brandEventService';
import {
  Building2,
  Calendar,
  MapPin,
  Users,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';