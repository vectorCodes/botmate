import {
  ChartAreaIcon,
  LayoutDashboard,
  Settings2Icon,
  ShoppingBagIcon,
} from 'lucide-react';
import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@botmate/ui';

import { useApp } from '../hooks/use-app';
import useCurrentBot from '../hooks/use-bot';
import { SidebarItem } from '../application';

const items: SidebarItem[] = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/',
    regex: /^\/$/,
  },
  {
    label: 'Analytics',
    icon: ChartAreaIcon,
    path: '/analytics',
    regex: /^\/analytics$/,
  },
  {
    label: 'Marketplace',
    icon: ShoppingBagIcon,
    path: '/marketplace',
    regex: /^\/marketplace$/,
  },
  {
    label: 'Settings',
    icon: Settings2Icon,
    path: '/settings',
    regex: /^\/settings/,
  },
];

function SidebarItem({
  path,
  isActive,
  Icon,
  item,
}: {
  path: string;
  isActive: boolean;
  Icon: any;
  item: (typeof items)[0];
}) {
  return (
    <Tooltip delayDuration={0}>
      <Link
        to={path}
        className="flex items-center justify-center cursor-default"
        draggable="false"
      >
        <TooltipTrigger
          className={
            `p-3 rounded-xl cursor-default ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-primary/10 text-black/70 dark:text-white'}` +
            `transition-all duration-150`
          }
        >
          <Icon
            size={24}
            className={
              isActive ? 'text-primary' : 'text-black/70 dark:text-white/70'
            }
          />
        </TooltipTrigger>
      </Link>
      <TooltipContent side="right" sideOffset={10}>
        <p>{item.label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function Sidebar() {
  const app = useApp();
  const params = useParams();
  const location = useLocation();
  const bot = useCurrentBot();
  
  return (
    <div className="w-24 h-full flex flex-col py-3 bg-card overflow-hidden">
      <div className="w-full h-20 flex items-center justify-center">
        <Link to="/" draggable="false">
          <img
            src="/logo.svg"
            alt="botmate"
            className="w-[3.5rem] rounded-2xl hover:-translate-y-1 transition-all duration-150 shadow-lg"
            draggable="false"
          />
        </Link>
      </div>

      <div className="flex flex-col py-4 gap-1 h-full overflow-auto">
        <TooltipProvider>
          {[...items,...(app.sidebar.length > 0 ? ['', ...app.sidebar] : [])].map((item, index) => {
            if (typeof item === 'string') {
              return <div key={index} className="h-px bg-muted/80 mx-5 my-2" />;
            }

            const Icon = item.icon;
            const relativePath = location.pathname.replace(/^\/bots\/\d+/, '');
            const isActive = item.regex ? item.regex.test(relativePath || '/') : item.path === relativePath;

            const absolutePath = `/bots/${params.botId}${item.path}`;

            return (
              <SidebarItem
                key={index}
                path={absolutePath}
                isActive={isActive}
                Icon={Icon}
                item={item}
              />
            );
          })}
        </TooltipProvider>
      </div>
      <div className="relative flex items-center justify-center" role="group">
        <img
          src={`/${bot.avatar}`}
          alt="botmate"
          className="w-[3.5rem] rounded-2xl cursor-default"
          draggable="false"
        />
      </div>
    </div>
  );
}

export default Sidebar;
