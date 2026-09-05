/**
 * Verbindungs-Karte der Web-Version (Redesign Phase 11).
 *
 * Der Schulmanager-Zugriff braucht im Browser einen Umweg (die API schickt
 * keine CORS-Header). Bislang war dieser Umweg ein fest verdrahteter Root-Pfad,
 * der auf statischem Hosting ins 404 führte — die Anbindung lud keine Daten,
 * während die installierte App einwandfrei lief. Diese Karte macht den Zustand
 * sichtbar und vor allem **reparierbar**: Wer eine Relay-Adresse einträgt
 * (z. B. einen eigenen Cloudflare-Worker aus `scripts/relay/`), bekommt die
 * Daten auch im Browser — ohne neuen App-Build.
 *
 * Auf nativen Plattformen rendert die Karte nichts: dort gibt es kein
 * Same-Origin-Problem, und die Einstellungen sind bewusst schlank gehalten.
 */
import React, { useState } from 'react';
import { Platform, Text, TextInput, View } from 'react-native';
import { Plug, RotateCcw, WifiOff } from 'lucide-react-native';

import { useSmTransport } from '@/api/use-transport';
import { useThemeColors } from '@/design/theme';
import { tint } from '@/design/subjects';
import { Button, ButtonText } from '@/ui/gluestack/button';
import { Spinner } from '@/ui/gluestack/feedback';
import { Card, IconBadge, Muted, Pill, Row } from '@/ui/primitives';
import { PressableOpacity } from '@/ui/motion';

export function WebConnectionCard() {
  const { colors } = useThemeColors();
  const { transport, checking, relayUrl, recheck, saveRelay } = useSmTransport();
  const [draft, setDraft] = useState('');

  if (Platform.OS !== 'web') return null;

  const blocked = !transport || transport.kind === 'blocked' || !transport.reachable;
  const accent = blocked ? colors.blocks.amber : colors.blocks.mint;

  return (
    <Card className="mb-2.5 gap-3">
      <Row className="gap-3">
        <IconBadge icon={blocked ? WifiOff : Plug} color={accent} size="lg" tone="tint" />
        <View className="flex-1">
          <Text className="text-[15.5px] font-extrabold text-ink">Verbindung zur Schule</Text>
          <Muted className="mt-0.5 text-[12px]" numberOfLines={2}>
            {transport?.detail ?? 'Weg zur API wird geprüft …'}
          </Muted>
        </View>
        <Pill
          label={transport ? transport.label : 'Prüft …'}
          color={blocked ? colors.priority.soon : colors.priority.ok}
          tone="solid"
        />
      </Row>

      {transport && transport.latencyMs > 0 ? (
        <Muted className="text-[11.5px]">
          Umweg in {transport.latencyMs} ms erreichbar · geprüft{' '}
          {new Date(transport.checkedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
        </Muted>
      ) : null}

      {blocked ? (
        <View className="rounded-[20px] p-3.5" style={{ backgroundColor: tint(colors.priority.soon, 0.14) }}>
          <Text className="text-[12.5px] font-semibold leading-[18px] text-ink">
            Im Browser blockiert die Schulmanager-API direkte Anfragen (kein CORS). Diese Installation stellt
            keinen Umweg bereit — deshalb bleiben die Screens leer. Zwei Wege daraus: die installierte App
            nutzen oder unten eine eigene Relay-Adresse eintragen. Die Bauanleitung liegt im Repository unter{' '}
            <Text className="font-extrabold">scripts/relay/</Text>.
          </Text>
        </View>
      ) : null}

      <View>
        <Text className="mb-1.5 text-[10.5px] font-extrabold uppercase tracking-[1.3px] text-muted">
          Umweg (Relay)
        </Text>
        <TextInput
          value={draft || relayUrl}
          onChangeText={setDraft}
          placeholder="https://schulflow-relay.mein-name.workers.dev/sm-api"
          placeholderTextColor={colors.faint}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          accessibilityLabel="Relay-Adresse für die Schulmanager-API"
          className="min-h-[52px] rounded-[20px] bg-canvas px-4 text-[14px] font-medium text-ink"
        />
        <Row className="mt-2.5 gap-2">
          <Button action="primary" size="sm" onPress={() => void saveRelay(draft || relayUrl)} className="flex-1">
            <ButtonText>Speichern &amp; prüfen</ButtonText>
          </Button>
          {relayUrl ? (
            <PressableOpacity
              onPress={() => {
                setDraft('');
                void saveRelay(null);
              }}
              accessibilityRole="button"
              accessibilityLabel="Umweg entfernen"
              className="min-h-[44px] items-center justify-center rounded-full bg-accent-amber/15 px-3.5"
            >
              <Text className="text-[12px] font-extrabold text-ink">Entfernen</Text>
            </PressableOpacity>
          ) : null}
          <PressableOpacity
            onPress={() => void recheck()}
            accessibilityRole="button"
            accessibilityLabel="Verbindung neu prüfen"
            className="min-h-[44px] flex-row items-center justify-center gap-1.5 rounded-full bg-accent-amber/15 px-3.5"
          >
            {checking ? <Spinner size="small" color={colors.ink} /> : <RotateCcw size={15} strokeWidth={2.4} color={colors.ink} />}
            <Text className="text-[12px] font-extrabold text-ink">Neu prüfen</Text>
          </PressableOpacity>
        </Row>
        <Muted className="mt-2 text-[11.5px] leading-[16px]">
          Der Umweg leitet Anfragen an die Schule weiter und sieht dabei dein Login-Token. Deshalb: eigene
          Adresse verwenden, nicht das erstbeste öffentliche Relay. Nativ (APK/iPA) ist der Umweg unnötig —
          dort verbindet sich Schulflow direkt.
        </Muted>
      </View>
    </Card>
  );
}
