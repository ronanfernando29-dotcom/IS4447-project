import InfoTag from '@/components/ui/info-tag';
import PrimaryButton from '@/components/ui/primary-button';
import ScreenHeader from '@/components/ui/screen-header';
import { db } from '@/db/client';
import { students as studentsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useContext } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Student, StudentContext } from '../_layout';

export default function StudentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const context = useContext(StudentContext);

  if (!context) return null;

  const { students, setStudents } = context;
  const student = students.find((s: Student) => s.id === Number(id));

  if (!student) return null;

  const deleteStudent = async () => {
    await db.delete(studentsTable).where(eq(studentsTable.id, Number(id)));
    const rows = await db.select().from(studentsTable);
    setStudents(rows);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title={student.name} subtitle="Student details" />

      <View style={styles.tags}>
        <InfoTag label="Major" value={student.major} />
        <InfoTag label="Year" value={student.year} />
      </View>

      <PrimaryButton
        label="Edit"
        onPress={() =>
          router.push({
            pathname: '../student/[id]/edit',
            params: { id },
          })
        }
      />

      <View style={styles.buttonSpacing}>
        <PrimaryButton
          label="Delete"
          variant="secondary"
          onPress={deleteStudent}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    marginBottom: 20,
  },
  buttonSpacing: {
    marginTop: 12,
  },
});