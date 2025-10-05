import React from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon.tsx';

interface StatCardProps {
  title: string;
  value: string;
  icon: any;
  link?: string;
  prefix?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, link, prefix = '' }) => {
  const content = (
    <div className="bg-black/30 border border-brand-gold/20 rounded-lg p-6 hover:bg-brand-gold/5 hover:border-brand-gold/40 transition-all h-full">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm uppercase tracking-wider text-brand-light/70">{title}</p>
                <p className="text-4xl font-bold text-brand-light mt-2">{prefix}{value}</p>
            </div>
            <div className="p-3 bg-brand-gold/10 rounded-md">
                <Icon name={icon} className="w-6 h-6 text-brand-gold" />
            </div>
        </div>
    </div>
  );

  return link ? <Link to={link}>{content}</Link> : content;
};

export default React.memo(StatCard);
