import { Linking, Text, View } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { parseMarkdown } from './markdown';

export function Markdown({ source }: { source: string }) {
  const { c, fonts } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      {parseMarkdown(source).map((b, i) => {
        const size = b.t === 'h' ? (b.level === 1 ? 22 : b.level === 2 ? 19 : 17) : 16;
        return (
          <Text key={i} style={{ fontFamily: b.t === 'h' ? fonts.display : fonts.body, fontSize: size, lineHeight: size + 8, color: b.t === 'h' ? c.gold : c.text }}>
            {b.t === 'li' ? '•  ' : ''}
            {b.inl.map((n, j) => n.t === 'link'
              ? <Text key={j} accessibilityRole="link" onPress={() => Linking.openURL(n.url)} style={{ color: c.ember, textDecorationLine: 'underline' }}>{n.s}</Text>
              : <Text key={j} style={{ fontFamily: n.b ? fonts.bodyBold : fonts.body, fontStyle: n.i ? 'italic' : 'normal' }}>{n.s}</Text>)}
          </Text>
        );
      })}
    </View>
  );
}
