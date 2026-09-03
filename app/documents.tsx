import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowUp, ChevronLeft, ChevronRight, Download, FileText, Folder, FolderOpen } from 'lucide-react-native';

import type { DocumentFolder, SchoolDocument } from '@/api/types';
import { useSession } from '@/state/session';
import { downloadStoredFile } from '@/api/downloads';
import { formatDay } from '@/lib/date';
import { htmlToText } from '@/lib/html';
import { hapticError, hapticLight, hapticSuccess } from '@/lib/haptics';
import { Card, Divider, EmptyState, IconButton, Muted, Row, Screen, Sheet, Skeleton, Title } from '@/ui/primitives';
import { FadeInUp } from '@/ui/motion';

interface Crumb {
  id: string;
  name: string;
}

export default function DocumentsScreen() {
  const router = useRouter();
  const { api } = useSession.getState();
  const isDemo = useSession((state) => state.status !== 'connected');

  const [path, setPath] = useState<Crumb[]>([]);
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [documents, setDocuments] = useState<SchoolDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SchoolDocument | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const currentId = path.length > 0 ? path[path.length - 1].id : 'root';

  const load = async (folderId: string) => {
    setLoading(true);
    try {
      if (isDemo) {
        const demo = demoFolder(folderId);
        setFolders(demo.folders);
        setDocuments(demo.documents);
      } else if (folderId === 'root') {
        const root = await api.documentRoot();
        const contents = root ? await api.documentContents(root.id) : { folders: [], documents: [] };
        setFolders(contents.folders);
        setDocuments(contents.documents);
      } else {
        const contents = await api.documentContents(folderId);
        setFolders(contents.folders);
        setDocuments(contents.documents);
      }
    } catch {
      hapticError();
      Alert.alert('Dokumente nicht ladbar', 'Das Modul ist für dein Konto evtl. nicht freigeschaltet.');
      setFolders([]);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(currentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId, isDemo]);

  const openFolder = (folder: DocumentFolder) => {
    hapticLight();
    setPath((prev) => [...prev, { id: String(folder.id), name: folder.name || 'Ordner' }]);
  };

  const openDocument = (document: SchoolDocument) => {
    hapticLight();
    if (document.file) {
      // Datei-Anhang: direkt laden und teilen.
      setDownloading(String(document.id));
      void downloadStoredFile(api, document.file)
        .then((result) => {
          hapticSuccess();
          if (result.mode === 'unknown') {
            Alert.alert('Verschlüsselte Datei', 'Diese Datei konnte nicht entschlüsselt werden und liegt verschlüsselt im Cache.');
          }
        })
        .catch(() => {
          hapticError();
          Alert.alert('Download fehlgeschlagen', 'Prüfe deine Verbindung und versuche es erneut.');
        })
        .finally(() => setDownloading(null));
      return;
    }
    setSelected(document);
  };

  return (
    <Screen adaptive="content">
      <Row className="px-4 pb-2 pt-2">
        <IconButton icon={ChevronLeft} onPress={() => router.back()} size={36} />
        <View className="ml-2 flex-1">
          <Title>Dokumente</Title>
          <Muted numberOfLines={1}>
            {path.length > 0 ? path.map((crumb) => crumb.name).join(' / ') : 'Ablage der Schule'}
          </Muted>
        </View>
      </Row>

      {path.length > 0 ? (
        <Row className="gap-2 px-4 pb-2">
          <IconButton
            icon={ArrowUp}
            size={32}
            onPress={() => setPath((prev) => prev.slice(0, -1))}
          />
          <Text className="text-[12px] text-muted" numberOfLines={1}>
            {path.map((crumb) => crumb.name).join('  ›  ')}
          </Text>
        </Row>
      ) : null}

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 60 }}>
        {loading ? (
          <View className="gap-2">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </View>
        ) : folders.length === 0 && documents.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            iconColor="#FAC748"
            title="Kein Inhalt"
            hint="Dieser Ordner ist leer — oder das Modul „Dokumente“ ist nicht gebucht."
          />
        ) : (
          <FadeInUp>
          <Card padded={false}>
            {folders.map((folder, index) => (
              <View key={`f-${String(folder.id)}`}>
                <PressableList
                  onPress={() => openFolder(folder)}
                  icon={<Folder size={19} strokeWidth={2} color="#FAC748" />}
                  title={folder.name || 'Ordner'}
                  right={<ChevronRight size={16} color="#9CA2B6" />}
                />
                {index < folders.length - 1 || documents.length > 0 ? <Divider className="ml-14" /> : null}
              </View>
            ))}
            {documents.map((document, index) => (
              <View key={`d-${String(document.id)}`}>
                <PressableList
                  onPress={() => openDocument(document)}
                  icon={
                    downloading === String(document.id) ? (
                      <ActivityIndicator size="small" color="#6C5CE7" />
                    ) : (
                      <FileText size={19} strokeWidth={2} color="#6C5CE7" />
                    )
                  }
                  title={document.name || 'Dokument'}
                  subtitle={document.updatedAt ? formatDay(document.updatedAt.slice(0, 10)) : undefined}
                  right={
                    document.file ? <Download size={16} strokeWidth={2} color="#9CA2B6" /> : undefined
                  }
                />
                {index < documents.length - 1 ? <Divider className="ml-14" /> : null}
              </View>
            ))}
          </Card>
          </FadeInUp>
        )}
      </ScrollView>

      <Sheet open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.name}>
        {selected ? (
          <Text className="text-[15px] leading-6 text-ink">{htmlToText(selected.content ?? '')}</Text>
        ) : null}
      </Sheet>
    </Screen>
  );
}

function PressableList({
  onPress,
  icon,
  title,
  subtitle,
  right,
}: {
  onPress: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <View>
      <Pressable
        onPress={onPress}
        android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
        style={({ pressed }: { pressed: boolean }) =>
          pressed ? { backgroundColor: 'rgba(108,92,231,0.06)' } : undefined
        }
      >
        <View className="flex-row items-center gap-3 px-4 py-3.5">
          {icon}
          <View className="flex-1">
            <Text className="text-[15px] font-semibold text-ink">{title}</Text>
            {subtitle ? <Text className="mt-0.5 text-[12px] text-muted">{subtitle}</Text> : null}
          </View>
          {right}
        </View>
      </Pressable>
    </View>
  );
}

/* ------------------------------------------------------------------ Demo-Daten */

function demoFolder(folderId: string): { folders: DocumentFolder[]; documents: SchoolDocument[] } {
  if (folderId === 'root') {
    return {
      folders: [
        { id: 'demo-docs-1', name: 'Elterninformationen' },
        { id: 'demo-docs-2', name: 'Stundenpläne' },
      ],
      documents: [
        {
          id: 'demo-doc-1',
          name: 'Willkommen.md',
          content: '<h3>Hallo!</h3><p>Hier sammelt die Schule wichtige Dokumente für euch.</p>',
          updatedAt: new Date().toISOString(),
        },
      ],
    };
  }
  if (folderId === 'demo-docs-1') {
    return {
      folders: [],
      documents: [
        {
          id: 'demo-doc-11',
          name: 'Elternabend-Einladung.pdf',
          content: null,
          file: null,
          updatedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
        },
      ],
    };
  }
  return {
    folders: [],
    documents: [
      {
        id: 'demo-doc-21',
        name: 'Stundenplan-Klasse 8b.pdf',
        content: null,
        file: null,
        updatedAt: new Date(Date.now() - 86400000 * 12).toISOString(),
      },
    ],
  };
}
