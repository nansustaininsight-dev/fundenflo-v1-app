import { StyleSheet, Text, View } from 'react-native';

import { HomeTabs } from '@/components/journey/home-tabs';
import { Screen } from '@/components/ui/screen';
import { C, F, R, S, shadow } from '@/constants/brand';
import { formatMobile } from '@/services/auth';
import { useAppStore } from '@/store/app-store';

export default function ProfileScreen() {
  const { session } = useAppStore();
  const user = session?.user;
  const name = user?.fullName?.trim();
  const mobile = user?.mobile ? `+91 ${formatMobile(user.mobile)}` : '';

  return (
    <Screen edges={['top']} flushFooter footer={<HomeTabs active="profile" />}>
      <Text style={s.title} accessibilityRole="header">Profile</Text>
      <View style={s.card}>
        <Text style={s.name}>{name || 'Your account'}</Text>
        {mobile ? <Text style={s.mobile}>{mobile}</Text> : null}
        {user?.pan ? <Text style={s.row}>PAN {user.pan}</Text> : null}
        {user?.dob ? <Text style={s.row}>Date of birth {user.dob}</Text> : null}
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  title: { fontFamily: F.heading, fontSize: 28, lineHeight: 36, color: C.navy },
  card: { marginTop: S.lg, padding: S.md + 4, borderRadius: R.card, backgroundColor: C.card, ...shadow.card },
  name: { fontFamily: F.heading, fontSize: 20, lineHeight: 28, color: C.navy },
  mobile: { fontFamily: F.body, fontSize: 15, color: C.muted, marginTop: 4 },
  row: { fontFamily: F.body, fontSize: 14, color: C.text, marginTop: S.sm },
});
