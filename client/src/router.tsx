import { createBrowserRouter } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Download from './pages/Download';
import Library from './pages/Library';
import Playlists from './pages/Playlists';
import Settings from './pages/Settings';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Download />,
      },
      {
        path: 'library',
        element: <Library />,
      },
      {
        path: 'playlists',
        element: <Playlists />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
]);
