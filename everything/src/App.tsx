import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Lobby from './pages/Lobby';
import Synthesis from './pages/Synthesis';
import Deck from './pages/Deck';
import Battle from './pages/Battle';
import GalaxyExplore from './pages/GalaxyExplore';
import UniverseMap from './pages/UniverseMap';
import PVP from './pages/PVP';
import Arena from './pages/Arena';
import CardPack from './pages/CardPack';
import Task from './pages/Task';
import Auction from './pages/Auction';
import Alchemy from './pages/Alchemy';
import Dungeon from './pages/Dungeon';
import Profile from './pages/Profile';
import Login from './pages/Login';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Lobby />} />
          <Route path="galaxy" element={<GalaxyExplore />} />
          <Route path="universe/:galaxyId" element={<UniverseMap />} />
          <Route path="synthesis" element={<Synthesis />} />
          <Route path="deck" element={<Deck />} />
          <Route path="battle" element={<Battle />} />
          <Route path="pvp" element={<PVP />} />
          <Route path="arena" element={<Arena />} />
          <Route path="cardpack" element={<CardPack />} />
          <Route path="task" element={<Task />} />
          <Route path="auction" element={<Auction />} />
          <Route path="alchemy" element={<Alchemy />} />
          <Route path="dungeon" element={<Dungeon />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
