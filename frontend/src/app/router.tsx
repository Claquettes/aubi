import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Spinner } from '@/components/primitives/Spinner';
import { RootLayout } from './layout/RootLayout';

const MusicHome = lazy(() =>
  import('@/pages/music/MusicHome').then((m) => ({ default: m.MusicHome })),
);
const ArtistList = lazy(() =>
  import('@/pages/music/ArtistList').then((m) => ({ default: m.ArtistList })),
);
const ArtistPage = lazy(() =>
  import('@/pages/music/ArtistPage').then((m) => ({ default: m.ArtistPage })),
);
const AlbumList = lazy(() =>
  import('@/pages/music/AlbumList').then((m) => ({ default: m.AlbumList })),
);
const AlbumPage = lazy(() =>
  import('@/pages/music/AlbumPage').then((m) => ({ default: m.AlbumPage })),
);
const ConcertList = lazy(() =>
  import('@/pages/concerts/ConcertList').then((m) => ({
    default: m.ConcertList,
  })),
);
const ConcertPage = lazy(() =>
  import('@/pages/concerts/ConcertPage').then((m) => ({
    default: m.ConcertPage,
  })),
);
const AudiobookList = lazy(() =>
  import('@/pages/audiobooks/AudiobookList').then((m) => ({
    default: m.AudiobookList,
  })),
);
const AudiobookPage = lazy(() =>
  import('@/pages/audiobooks/AudiobookPage').then((m) => ({
    default: m.AudiobookPage,
  })),
);
const BibleHome = lazy(() =>
  import('@/pages/audiobooks/BibleHome').then((m) => ({ default: m.BibleHome })),
);
const BibleBookPage = lazy(() =>
  import('@/pages/audiobooks/BibleBookPage').then((m) => ({
    default: m.BibleBookPage,
  })),
);
const PlaylistList = lazy(() =>
  import('@/pages/playlists/PlaylistList').then((m) => ({
    default: m.PlaylistList,
  })),
);
const PlaylistPage = lazy(() =>
  import('@/pages/playlists/PlaylistPage').then((m) => ({
    default: m.PlaylistPage,
  })),
);
const LikesPage = lazy(() =>
  import('@/pages/likes/LikesPage').then((m) => ({ default: m.LikesPage })),
);
const StatsPage = lazy(() =>
  import('@/pages/stats/StatsPage').then((m) => ({ default: m.StatsPage })),
);
const SearchPage = lazy(() =>
  import('@/pages/search/SearchPage').then((m) => ({ default: m.SearchPage })),
);
const SettingsPage = lazy(() =>
  import('@/pages/settings/SettingsPage').then((m) => ({
    default: m.SettingsPage,
  })),
);

function SuspenseWrap({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
          <Spinner />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

export function AppRouter() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path="/" element={<Navigate to="/music" replace />} />
        <Route
          path="/music"
          element={
            <SuspenseWrap>
              <MusicHome />
            </SuspenseWrap>
          }
        />
        <Route
          path="/music/artists"
          element={
            <SuspenseWrap>
              <ArtistList />
            </SuspenseWrap>
          }
        />
        <Route
          path="/music/artists/:id"
          element={
            <SuspenseWrap>
              <ArtistPage />
            </SuspenseWrap>
          }
        />
        <Route
          path="/music/albums"
          element={
            <SuspenseWrap>
              <AlbumList />
            </SuspenseWrap>
          }
        />
        <Route
          path="/music/albums/:id"
          element={
            <SuspenseWrap>
              <AlbumPage />
            </SuspenseWrap>
          }
        />
        <Route
          path="/concerts"
          element={
            <SuspenseWrap>
              <ConcertList />
            </SuspenseWrap>
          }
        />
        <Route
          path="/concerts/:id"
          element={
            <SuspenseWrap>
              <ConcertPage />
            </SuspenseWrap>
          }
        />
        <Route
          path="/audiobooks"
          element={
            <SuspenseWrap>
              <AudiobookList />
            </SuspenseWrap>
          }
        />
        <Route
          path="/audiobooks/bible"
          element={
            <SuspenseWrap>
              <BibleHome />
            </SuspenseWrap>
          }
        />
        <Route
          path="/audiobooks/bible/:id"
          element={
            <SuspenseWrap>
              <BibleBookPage />
            </SuspenseWrap>
          }
        />
        <Route
          path="/audiobooks/:id"
          element={
            <SuspenseWrap>
              <AudiobookPage />
            </SuspenseWrap>
          }
        />
        <Route
          path="/playlists"
          element={
            <SuspenseWrap>
              <PlaylistList />
            </SuspenseWrap>
          }
        />
        <Route
          path="/playlists/:id"
          element={
            <SuspenseWrap>
              <PlaylistPage />
            </SuspenseWrap>
          }
        />
        <Route
          path="/likes"
          element={
            <SuspenseWrap>
              <LikesPage />
            </SuspenseWrap>
          }
        />
        <Route
          path="/stats"
          element={
            <SuspenseWrap>
              <StatsPage />
            </SuspenseWrap>
          }
        />
        <Route
          path="/search"
          element={
            <SuspenseWrap>
              <SearchPage />
            </SuspenseWrap>
          }
        />
        <Route
          path="/settings"
          element={
            <SuspenseWrap>
              <SettingsPage />
            </SuspenseWrap>
          }
        />
      </Route>
    </Routes>
  );
}
