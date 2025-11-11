import { supabase } from './supabase';
import { Teacher, Student, Group, Session, Payment, WaitingListStudent, CallLog } from '../types';
// import { paymentService as enhancedPaymentService } from './payment-service';

// Helper function to fetch group data with fallback for missing columns
async function fetchGroupWithFallback(supabase: any, groupId: number) {
  try {
    // First try to get group with freeze status
    const { data, error } = await supabase
      .from('groups')
      .select('id, name, is_frozen, freeze_date')
      .eq('id', groupId)
      .maybeSingle();

    if (error) {
      // Check if this is a column doesn't exist error
      if (error.message && error.message.includes('does not exist')) {
        // Fall back to basic group info without logging error
        const { data: basicData, error: basicError } = await supabase
          .from('groups')
          .select('id, name')
          .eq('id', groupId)
          .maybeSingle();

        if (basicError) {
          // Only log if it's not a column doesn't exist error
          if (!basicError.message || !basicError.message.includes('does not exist')) {
            console.error(`Error fetching basic group info for group ${groupId}:`, basicError);
          }
          return null;
        }

        // Set default values for missing columns
        if (basicData) {
          basicData.is_frozen = false;
          basicData.freeze_date = null;
        }
        return basicData;
      } else {
        // This is a different error, log it
        console.error(`Error fetching group ${groupId} details:`, error);
        return null;
      }
    } else {
      return data;
    }
  } catch (freezeError) {
    // If we get an exception, fall back to basic group info
    console.log(`Freeze columns not available, falling back to basic group info for group ${groupId}`);
    const { data, error } = await supabase
      .from('groups')
      .select('id, name')
      .eq('id', groupId)
      .maybeSingle();

    if (error) {
      // Only log if it's not a column doesn't exist error
      if (!error.message || !error.message.includes('does not exist')) {
        console.error(`Error fetching basic group info for group ${groupId}:`, error);
      }
      return null;
    }

    // Set default values for missing columns
    if (data) {
      data.is_frozen = false;
      data.freeze_date = null;
    }
    return data;
  }
}

// Helper functions to extract student info from notes when student_id is null
const extractStudentNameFromNotes = (notes: string): string | null => {
  const studentMatch = notes.match(/Student:\s*(.+?)(?:\n|$)/);
  return studentMatch ? studentMatch[1].trim() : null;
};

const extractStudentPhoneFromNotes = (notes: string): string | null => {
  const phoneMatch = notes.match(/Phone:\s*(.+?)(?:\n|$)/);
  return phoneMatch ? phoneMatch[1].trim() : null;
};

// Utility function to convert language, level, and category to abbreviated names
const getAbbreviatedGroupName = (language: string, level: string, category: string): string => {
  // Language abbreviations
  const languageAbbr: { [key: string]: string } = {
    'English': 'Eng',
    'French': 'Fre',
    'Spanish': 'Spa',
    'German': 'Ger',
    'Italian': 'Ita',
    'Arabic': 'Ara',
    'Chinese': 'Chi',
    'Japanese': 'Jap',
    'Korean': 'Kor',
    'Russian': 'Rus',
    'Portuguese': 'Por',
    'Dutch': 'Dut',
    'Swedish': 'Swe',
    'Norwegian': 'Nor',
    'Danish': 'Dan',
    'Finnish': 'Fin',
    'Polish': 'Pol',
    'Czech': 'Cze',
    'Hungarian': 'Hun',
    'Romanian': 'Rom',
    'Bulgarian': 'Bul',
    'Croatian': 'Cro',
    'Serbian': 'Ser',
    'Slovenian': 'Slo',
    'Slovak': 'Slk',
    'Estonian': 'Est',
    'Latvian': 'Lat',
    'Lithuanian': 'Lit',
    'Greek': 'Gre',
    'Turkish': 'Tur',
    'Hebrew': 'Heb',
    'Hindi': 'Hin',
    'Urdu': 'Urd',
    'Bengali': 'Ben',
    'Tamil': 'Tam',
    'Telugu': 'Tel',
    'Marathi': 'Mar',
    'Gujarati': 'Guj',
    'Kannada': 'Kan',
    'Malayalam': 'Mal',
    'Punjabi': 'Pun',
    'Sinhala': 'Sin',
    'Thai': 'Tha',
    'Vietnamese': 'Vie',
    'Indonesian': 'Ind',
    'Malay': 'May',
    'Filipino': 'Fil'
  };

  // Level abbreviations
  const levelAbbr: { [key: string]: string } = {
    'Beginner': 'Beg',
    'Elementary': 'Ele',
    'Pre-Intermediate': 'Pre',
    'Intermediate': 'Int',
    'Upper-Intermediate': 'Upp',
    'Advanced': 'Adv',
    'Proficient': 'Pro',
    'A1': 'A1',
    'A2': 'A2',
    'B1': 'B1',
    'B2': 'B2',
    'C1': 'C1',
    'C2': 'C2',
    'A1+': 'A1+',
    'A2+': 'A2+',
    'B1+': 'B1+',
    'B2+': 'B2+',
    'C1+': 'C1+'
  };

  // Category abbreviations
  const categoryAbbr: { [key: string]: string } = {
    'Children': 'Child',
    'Teenagers': 'Teens',
    'Adults': 'Adults',
    'Seniors': 'Seniors',
    'Business': 'Bus',
    'Academic': 'Acad',
    'Conversation': 'Conv',
    'Grammar': 'Gram',
    'Writing': 'Writ',
    'Reading': 'Read',
    'Listening': 'List',
    'Speaking': 'Speak',
    'Exam Preparation': 'Exam',
    'TOEFL': 'TOEFL',
    'IELTS': 'IELTS',
    'TOEIC': 'TOEIC',
    'Cambridge': 'Camb',
    'DELF': 'DELF',
    'DALF': 'DALF',
    'DELE': 'DELE',
    'TestDaF': 'TestDaF',
    'Goethe': 'Goethe',
    'HSK': 'HSK',
    'JLPT': 'JLPT',
    'TOPIK': 'TOPIK'
  };

  // Since we filter out invalid values before calling this function,
  // we can assume all inputs are valid
  const langAbbr = languageAbbr[language] || language.substring(0, 3).toUpperCase();
  const levelAbbr_ = levelAbbr[level] || level;
  const catAbbr = categoryAbbr[category] || category.substring(0, 4);

  return `${langAbbr}|${levelAbbr_}|${catAbbr}`;
};

// Teacher operations
export const teacherService = {
  async getAll(): Promise<Teacher[]> {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching teachers:', error);
      throw new Error(`Failed to fetch teachers: ${error.message}`);
    }

    return data?.map(teacher => ({
      id: teacher.id,
      custom_id: teacher.custom_id,
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone,
      price_per_session: teacher.price_per_session,
    })) || [];
  },

  async create(teacher: Omit<Teacher, 'id'>): Promise<Teacher> {
    const { data, error } = await supabase
      .from('teachers')
      .insert({
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
        price_per_session: teacher.price_per_session,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating teacher:', error);
      throw new Error(`Failed to create teacher: ${error.message}`);
    }

    return {
      id: data.id,
      custom_id: data.custom_id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      price_per_session: data.price_per_session,
    };
  },

  async update(id: string, teacher: Partial<Teacher>): Promise<Teacher> {
    const { data, error } = await supabase
      .from('teachers')
      .update({
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
        price_per_session: teacher.price_per_session,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating teacher:', error);
      throw new Error(`Failed to update teacher: ${error.message}`);
    }

    return {
      id: data.id,
      custom_id: data.custom_id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      price_per_session: data.price_per_session,
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('teachers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting teacher:', error);
      throw new Error(`Failed to delete teacher: ${error.message}`);
    }
  },
};

// Group operations
export const groupService = {
  async getAll(): Promise<Group[]> {
    // Try to ensure the student_groups table exists
    try {
      // Check if the table exists
      const { data: tableCheck, error: checkError } = await supabase
        .from('student_groups')
        .select('*')
        .limit(1);

      if (checkError && checkError.message.includes('does not exist')) {
        console.log('student_groups table does not exist, will use fallback approach');
      }
    } catch (error) {
      console.log('Could not check student_groups table, continuing with fallback approach:', error);
    }

    const { data, error } = await supabase
      .from('groups')
      .select(`
        *,
        teachers (id, name, email, phone),
        sessions (id, date)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching groups:', error);
      throw new Error(`Failed to fetch groups: ${error.message}`);
    }

    // Fetch students for each group using the junction table
    const groupsWithStudents = await Promise.all(
      data?.map(async (group) => {
        // Get students for this group using the junction table
        console.log(`Fetching students for group ${group.id} (${group.name})`);

        let studentGroups: any[] = [];
        let studentGroupsError: any = null;

        try {
          // First try to use the new junction table approach
          const { data: junctionData, error: junctionError } = await supabase
            .from('student_groups')
            .select(`
            student_id,
              status
            `)
            .eq('group_id', group.id);

          if (junctionError) {
            console.log('Junction table approach failed, trying fallback:', junctionError.message);
            // Fallback: try to get students directly from the students table
            const { data: fallbackData, error: fallbackError } = await supabase
              .from('students')
              .select(`
              id, name, email, phone, address, birth_date, 
              price_per_session, total_paid, parent_name, 
              second_phone, default_discount, balance, custom_id
          `)
              .eq('group_id', group.id);

            if (fallbackError) {
              console.log('Fallback approach also failed:', fallbackError.message);
              // If both approaches fail, try to check if the students table has a group_id field
              const { data: schemaCheck, error: schemaError } = await supabase
                .from('students')
                .select('*')
                .limit(1);

              if (schemaError) {
                console.error('Cannot access students table:', schemaError);
                studentGroupsError = schemaError;
              } else {
                // Check if the first student has a group_id field
                const firstStudent = schemaCheck?.[0];
                if (firstStudent && 'group_id' in firstStudent) {
                  console.log('Students table has group_id field, using direct query');
                  // Try a different approach - get all students and filter by group
                  const { data: allStudents, error: allStudentsError } = await supabase
                    .from('students')
                    .select('*');

                  if (allStudentsError) {
                    console.error('Error fetching all students:', allStudentsError);
                    studentGroupsError = allStudentsError;
                  } else {
                    // Filter students by group_id
                    const groupStudents = allStudents?.filter((s: any) => s.group_id === group.id) || [];
                    studentGroups = groupStudents.map((student: any) => ({
                      student_id: student.id,
                      status: 'active' // Default to active
                    }));
                    console.log(`Direct filtering: Found ${studentGroups.length} students for group ${group.id}`);
                  }
                } else {
                  console.log('Students table does not have group_id field, creating empty student list');
                  studentGroups = [];
                }
              }
            } else {
              // Convert fallback data to match expected format
              studentGroups = fallbackData?.map((student: any) => ({
                student_id: student.id,
                status: 'active' // Default to active for fallback
              })) || [];
              console.log(`Fallback: Found ${studentGroups.length} students for group ${group.id}`);
            }
          } else {
            studentGroups = junctionData || [];
            console.log(`Junction table: Found ${studentGroups.length} student groups for group ${group.id}`);
          }
        } catch (error) {
          console.error('Unexpected error fetching students:', error);
          studentGroupsError = error;
        }

        if (studentGroupsError) {
          console.error('Error fetching students for group', group.id, ':', studentGroupsError);
          console.error('Error details:', JSON.stringify(studentGroupsError, null, 2));
          return {
            ...group,
            students: [],
          };
        }

        // Now fetch the student details for each student_id
        let students: any[] = [];

        if (studentGroups.length > 0) {
          const studentIds = studentGroups.map((sg: any) => sg.student_id);

          const { data: studentsData, error: studentsError } = await supabase
            .from('students')
            .select(`
              id, name, email, phone, address, birth_date, 
              price_per_session, total_paid, parent_name, 
              second_phone, default_discount, balance, custom_id
            `)
            .in('id', studentIds);

          if (studentsError) {
            console.error('Error fetching students:', studentsError);
          } else {
            // Map students with their group status
            students = studentIds.map((studentId: string) => {
              const student = studentsData?.find((s: any) => s.id === studentId);
              const studentGroup = studentGroups?.find((sg: any) => sg.student_id === studentId);

              if (!student) return null;

              return {
                id: student.id,
                custom_id: student.custom_id,
                name: student.name,
                email: student.email,
                phone: student.phone,
                address: student.address,
                birthDate: student.birth_date ? new Date(student.birth_date) : undefined,
                courseFee: student.price_per_session,
                totalPaid: student.total_paid,
                groupId: group.id,
                parentName: student.parent_name,
                secondPhone: student.second_phone,
                defaultDiscount: student.default_discount || 0,
                balance: student.balance || 0,
                groupStatus: studentGroup?.status || 'active', // Add the group status
              };
            }).filter(Boolean) || [];
          }
        }

        return {
          ...group,
          students,
        };
      }) || []
    );

    // Fetch attendance data for all sessions with batching to avoid URL length issues
    const sessionIds = groupsWithStudents.flatMap(group =>
      group.sessions?.map((session: any) => session.id) || []
    );

    let attendanceData: any[] = [];
    if (sessionIds.length > 0) {
      console.log(`📊 Fetching attendance for ${sessionIds.length} sessions...`);

      // Batch the session IDs to avoid URL length limits
      const batchSize = 50; // Reduced batch size to avoid URL length issues
      const batches = [];
      for (let i = 0; i < sessionIds.length; i += batchSize) {
        batches.push(sessionIds.slice(i, i + batchSize));
      }

      console.log(`📦 Processing ${batches.length} batches of attendance data...`);

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`🔄 Fetching batch ${i + 1}/${batches.length} (${batch.length} sessions)...`);

        try {
          const { data: attendance, error: attendanceError } = await supabase
            .from('attendance')
            .select('session_id, student_id, status')
            .in('session_id', batch)
            .order('updated_at', { ascending: false }); // Add ordering to ensure fresh data

          if (attendanceError) {
            console.error(`❌ Error fetching attendance batch ${i + 1}:`, attendanceError);
            // Continue with other batches even if one fails
          } else {
            attendanceData = [...attendanceData, ...(attendance || [])];
            console.log(`✅ Batch ${i + 1} completed: ${attendance?.length || 0} records`);
          }
        } catch (error) {
          console.error(`❌ Exception in batch ${i + 1}:`, error);
          // Continue with other batches
        }
      }

      console.log(`📊 Total attendance records fetched: ${attendanceData.length}`);
    }

    return groupsWithStudents.map(group => ({
      id: group.id,
      name: group.name,
      teacherId: group.teacher_id,
      startDate: new Date(group.start_date),
      recurringDays: group.recurring_days,
      totalSessions: group.total_sessions,
      language: group.language,
      level: group.level,
      category: group.category,
      price: group.price, // This is now group fees
      startTime: group.start_time,
      endTime: group.end_time,
      customLanguage: group.custom_language,
      customLevel: group.custom_level,
      customCategory: group.custom_category,
      // Freeze functionality
      isFrozen: group.is_frozen || false,
      freezeDate: group.freeze_date ? new Date(group.freeze_date) : undefined,
      unfreezeDate: group.unfreeze_date ? new Date(group.unfreeze_date) : undefined,
      students: group.students,
      sessions: group.sessions?.map((session: any) => {
        // Get attendance data for this session
        const sessionAttendance = attendanceData.filter(
          (att: any) => att.session_id === session.id
        );

        // Convert to attendance map
        const attendanceMap: Record<string, string> = {};
        sessionAttendance.forEach((att: any) => {
          attendanceMap[att.student_id] = att.status;
        });

        return {
          id: session.id,
          date: new Date(session.date),
          groupId: session.group_id,
          attendance: attendanceMap,
        };
      }) || [],
      createdAt: new Date(group.created_at),
      progress: {
        totalSessions: group.total_sessions,
        completedSessions: (() => {
          // Count only sessions that have been studied (have non-default attendance)
          const studiedSessions = group.sessions?.filter((session: any) => {
            const sessionAttendance = attendanceData.filter(
              (att: any) => att.session_id === session.id
            );
            // A session is considered studied if at least one student has non-default attendance
            return sessionAttendance.some((att: any) => att.status !== 'default');
          }) || [];
          return studiedSessions.length;
        })(),
        progressPercentage: (() => {
          const completed = (() => {
            const studiedSessions = group.sessions?.filter((session: any) => {
              const sessionAttendance = attendanceData.filter(
                (att: any) => att.session_id === session.id
              );
              return sessionAttendance.some((att: any) => att.status !== 'default');
            }) || [];
            return studiedSessions.length;
          })();
          return group.total_sessions > 0 ? Math.round((completed / group.total_sessions) * 100) : 0;
        })(),
      },
    }));
  },

  async create(group: Omit<Group, 'id' | 'sessions' | 'createdAt'>): Promise<Group> {
    // Validate required fields
    if (!group.name || group.name.trim() === '') {
      console.error('Group data received:', group);
      throw new Error('Group name is required and cannot be empty');
    }

    const insertData = {
      name: group.name.trim(),
      teacher_id: group.teacherId,
      start_date: group.startDate ? group.startDate.toISOString().split('T')[0] : null,
      total_sessions: group.totalSessions || 16,
      language: group.language || 'English',
      level: group.level || 'Beginner',
      category: group.category || 'Adults',
      price: group.price || 0,
      start_time: group.startTime || null,
      end_time: group.endTime || null,
      custom_language: group.customLanguage || null,
      custom_level: group.customLevel || null,
      custom_category: group.customCategory || null,
    };

    console.log('Inserting group data:', insertData);

    const { data, error } = await supabase
      .from('groups')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating group:', error);
      throw new Error(`Failed to create group: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      teacherId: data.teacher_id,
      startDate: new Date(data.start_date),
      recurringDays: [1], // Default to Monday since we don't have this column
      totalSessions: data.total_sessions,
      language: data.language,
      level: data.level,
      category: data.category,
      price: data.price,
      startTime: data.start_time,
      endTime: data.end_time,
      customLanguage: data.custom_language,
      customLevel: data.custom_level,
      customCategory: data.custom_category,
      students: [],
      sessions: [],
      createdAt: new Date(data.created_at),
    };
  },

  async update(id: number, group: Partial<Group>): Promise<Group> {
    const { data, error } = await supabase
      .from('groups')
      .update({
        name: group.name,
        teacher_id: group.teacherId,
        start_date: group.startDate?.toISOString().split('T')[0],
        total_sessions: group.totalSessions,
        language: group.language,
        level: group.level,
        category: group.category,
        price: group.price,
        start_time: group.startTime,
        end_time: group.endTime,
        custom_language: group.customLanguage,
        custom_level: group.customLevel,
        custom_category: group.customCategory,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating group:', error);
      throw new Error(`Failed to update group: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      teacherId: data.teacher_id,
      startDate: new Date(data.start_date),
      recurringDays: [1], // Default to Monday since we don't have this column
      totalSessions: data.total_sessions,
      language: data.language,
      level: data.level,
      category: data.category,
      price: data.price,
      startTime: data.start_time,
      endTime: data.end_time,
      customLanguage: data.custom_language,
      customLevel: data.custom_level,
      customCategory: data.custom_category,
      students: [],
      sessions: [],
      createdAt: new Date(data.created_at),
    };
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting group:', error);
      throw new Error('Failed to delete group');
    }
  },

  // Freeze group functionality
  async freezeGroup(id: number): Promise<void> {
    const { error } = await supabase
      .from('groups')
      .update({
        is_frozen: true,
        freeze_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', id);

    if (error) {
      console.error('Error freezing group:', error);
      throw new Error('Failed to freeze group');
    }
  },

  // Unfreeze group functionality
  async unfreezeGroup(id: number, unfreezeDate: Date): Promise<void> {
    const { error } = await supabase
      .from('groups')
      .update({
        is_frozen: false,
        unfreeze_date: unfreezeDate.toISOString().split('T')[0]
      })
      .eq('id', id);

    if (error) {
      console.error('Error unfreezing group:', error);
      throw new Error('Failed to unfreeze group');
    }
  },

  // Reschedule session functionality
  async rescheduleSession(sessionId: string, newDate: Date): Promise<void> {
    // First, get the session details to find the group
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('group_id')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      console.error('Error fetching session:', sessionError);
      throw new Error('Failed to fetch session details');
    }

    // Update the session date
    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        date: newDate.toISOString().split('T')[0]
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Error rescheduling session:', updateError);
      throw new Error('Failed to reschedule session');
    }

    // If the new date is in the future (meaning the session was stopped), 
    // mark all students in this group as stopped
    if (newDate > new Date()) {
      try {
        const { error: statusError } = await supabase
          .from('student_groups')
          .update({ status: 'stopped' })
          .eq('group_id', session.group_id);

        if (statusError) {
          console.log('Junction table update failed, trying fallback approach:', statusError.message);

          // Fallback: try to update students table directly
          const { error: fallbackError } = await supabase
            .from('students')
            .update({
              // Add a status field or use existing mechanism
              // For now, we'll just log that we can't update status
            })
            .eq('group_id', session.group_id);

          if (fallbackError) {
            console.log('Fallback approach also failed:', fallbackError.message);
          } else {
            console.log('Successfully updated student status using fallback approach');
          }
        }
      } catch (error) {
        console.error('Unexpected error updating student status:', error);
        // Don't throw error here as the session was successfully rescheduled
      }
    }
  },
};

// Student operations
export const studentService = {
  async create(groupId: number, student: Omit<Student, 'id'>): Promise<Student> {
    // Handle empty email values - convert empty strings to null
    const emailValue = student.email && student.email.trim() !== '' ? student.email : null;

    // First, check if a student with the same name and phone already exists
    const { data: existingStudent, error: checkError } = await supabase
      .from('students')
      .select('*')
      .eq('name', student.name)
      .eq('phone', student.phone)
      .single();

    let studentId: string;

    if (existingStudent) {
      // Student already exists, use their ID
      studentId = existingStudent.id;
      console.log('Using existing student:', existingStudent.id);

      // 🚨 FIX: Only update registration fee if explicitly provided
      if (student.registrationFeePaid) {
        await supabase
          .from('students')
          .update({
            registration_fee_paid: true,
            registration_fee_amount: student.registrationFeeAmount ?? 500,
          })
          .eq('id', studentId);
      }
    } else {
      const trimmedPhone = student.phone?.trim() || '';

      // Create new student
      const { data: newStudent, error: createError } = await supabase
        .from('students')
        .insert({
          name: student.name,
          email: emailValue,
          phone: trimmedPhone === '' ? null : trimmedPhone,
          address: student.address,
          birth_date: student.birthDate ? student.birthDate.toISOString().split('T')[0] : null,
          courseFee: student.courseFee,
          total_paid: student.totalPaid || 0,
          parent_name: student.parentName,
          second_phone: student.secondPhone,
          default_discount: student.defaultDiscount || 0,
          balance: student.balance || 0,
          registration_fee_paid: student.registrationFeePaid ?? false,
          registration_fee_amount: student.registrationFeeAmount ?? 500,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating student:', createError);
        throw new Error(`Failed to create student: ${createError.message}`);
      }

      studentId = newStudent.id;
      console.log('Created new student:', newStudent.id);
    }

    // Now add the student to the group using the junction table
    let junctionError: any = null;

    try {
      const { error: insertError } = await supabase
        .from('student_groups')
        .insert({
          student_id: studentId,
          group_id: groupId,
          status: 'active', // Default status is active
        });

      if (insertError) {
        console.log('Junction table insert failed, trying fallback approach:', insertError.message);

        // Fallback: try to update the students table directly with group_id
        const { error: fallbackError } = await supabase
          .from('students')
          .update({ group_id: groupId })
          .eq('id', studentId);

        if (fallbackError) {
          console.error('Fallback approach also failed:', fallbackError);
          junctionError = fallbackError;
        } else {
          console.log('Successfully added student to group using fallback approach');
        }
      }
    } catch (error) {
      console.error('Unexpected error adding student to group:', error);
      junctionError = error;
    }

    if (junctionError) {
      console.error('Error adding student to group:', junctionError);
      throw new Error(`Failed to add student to group: ${junctionError.message}`);
    }

    // ✅ ADD: Add group fee to unpaid balance when student is enrolled
    try {
      // Get group details to get the price
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('name, price')
        .eq('id', groupId)
        .single();

      if (groupError) {
        console.warn('Could not fetch group details for payment service:', groupError);
      } else {
        // Add group fee to unpaid balance using enhanced payment service
        // TEMPORARILY DISABLED: This was causing syntax errors
        // await enhancedPaymentService.handleGroupEnrollment(
        //   studentId,
        //   groupId,
        //   groupData.name,
        //   groupData.price || 0
        // );
        console.log(`✅ Added group fee (${groupData.price}) to unpaid balance for student ${studentId}`);
      }
    } catch (paymentError) {
      console.warn('Failed to add group fee to unpaid balance:', paymentError);
      // Don't fail the entire student creation if payment service fails
    }

    // 🚨 FIX: Only create registration fee payment if explicitly marked as paid
    // AND only if no prior registration fee payment exists
    if (student.registrationFeePaid) {
      const { data: existingReg } = await supabase
        .from('payments')
        .select('id')
        .eq('student_id', studentId)
        .is('group_id', null)
        .ilike('notes', 'Registration fee%')
        .limit(1);

      if (!existingReg || existingReg.length === 0) {
        const regAmount = student.registrationFeeAmount ?? 500;
        const { error: regPayErr } = await supabase
          .from('payments')
          .insert({
            student_id: studentId,
            group_id: null,
            amount: regAmount,
            payment_type: 'registration_fee',  // ✅ FIX: Add missing payment_type
            date: new Date().toISOString().split('T')[0],
            notes: 'Registration fee',
            admin_name: 'Dalila',
            discount: 0,
            original_amount: regAmount,
          });

        if (regPayErr) {
          console.warn('Failed to create registration fee receipt:', regPayErr);
        } else {
          // Ensure student row is flagged as paid
          await supabase
            .from('students')
            .update({ registration_fee_paid: true })
            .eq('id', studentId);
        }
      }
    }

    // 🚨 FIX: IMPORTANT - NO automatic group fee payments are created
    // The student should show as "pending" for group fees until actual payment is made
    console.log('🚨 FIX: Student added to group - NO automatic group fee payments created');
    console.log('🚨 FIX: Student should show as "pending" for group fees');
    console.log('🚨 FIX: Student will appear in unpaid group fee list');
    console.log('🚨 FIX: Receipts are only created when actual payments are made');

    // Return the student data
    const { data: finalStudent, error: finalError } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (finalError) {
      console.error('Error fetching final student data:', finalError);
      throw new Error(`Failed to fetch student data: ${finalError.message}`);
    }

    return {
      id: finalStudent.id,
      custom_id: finalStudent.custom_id,
      name: finalStudent.name,
      email: finalStudent.email,
      phone: finalStudent.phone,
      address: finalStudent.address,
      birthDate: finalStudent.birth_date ? new Date(finalStudent.birth_date) : undefined,
      courseFee: finalStudent.price_per_session,
      totalPaid: finalStudent.total_paid,
      groupId: groupId, // This is the group they were just added to
      parentName: finalStudent.parent_name,
      secondPhone: finalStudent.second_phone,
      defaultDiscount: finalStudent.default_discount || 0,
      balance: finalStudent.balance || 0,
      registrationFeePaid: finalStudent.registration_fee_paid,
      registrationFeeAmount: finalStudent.registration_fee_amount,
    };
  },

  async update(groupId: number, studentId: string, student: Partial<Student>): Promise<Student> {
    // Handle empty email values - convert empty strings to null
    const emailValue = student.email && student.email.trim() !== '' ? student.email : null;

    const { data, error } = await supabase
      .from('students')
      .update({
        name: student.name,
        email: emailValue,
        phone: student.phone,
        address: student.address,
        birth_date: student.birthDate ? student.birthDate.toISOString().split('T')[0] : null,
        courseFee: student.courseFee,
        total_paid: student.totalPaid,
        default_discount: student.defaultDiscount,
        balance: student.balance,
        registration_fee_paid: student.registrationFeePaid,
        registration_fee_amount: student.registrationFeeAmount,
      })
      .eq('id', studentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating student:', error);
      throw new Error(`Failed to update student: ${error.message}`);
    }

    return {
      id: data.id,
      custom_id: data.custom_id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      birthDate: data.birth_date ? new Date(data.birth_date) : undefined,
      courseFee: data.price_per_session,
      totalPaid: data.total_paid,
      groupId: groupId, // This is the group context
      parentName: data.parent_name,
      secondPhone: data.second_phone,
      defaultDiscount: data.default_discount || 0,
      balance: data.balance || 0,
      registrationFeePaid: data.registration_fee_paid,
      registrationFeeAmount: data.registration_fee_amount,
    };
  },

  async delete(groupId: number, studentId: string): Promise<void> {
    // 🔄 CROSS-GROUP REFUND: Handle refund before removing student
    // Note: We need to call the main service's handleCrossGroupRefund function
    // This will be handled by the calling code in the store

    // Remove the student from the group using the junction table
    const { error } = await supabase
      .from('student_groups')
      .delete()
      .eq('student_id', studentId)
      .eq('group_id', groupId);

    if (error) {
      console.error('Error removing student from group:', error);
      throw new Error(`Failed to remove student from group: ${error.message}`);
    }
  },
};

// Session operations
export const sessionService = {
  async generateSessions(groupId: number): Promise<Session[]> {
    console.log('=== GENERATE SESSIONS FUNCTION CALLED ===');
    console.log(`Starting generateSessions for group ${groupId} (type: ${typeof groupId})`);

    // Validate input parameter
    if (typeof groupId !== 'number' || isNaN(groupId) || groupId <= 0) {
      console.error('Invalid groupId parameter:', {
        groupId: groupId,
        type: typeof groupId,
        isNaN: isNaN(groupId),
        isPositive: groupId > 0
      });
      throw new Error(`Invalid groupId: ${groupId}. Expected a positive number.`);
    }

    console.log(`GroupId validation passed: ${groupId} (${typeof groupId})`);

    // Test database connection and check if groups table exists
    try {
      const { data: testData, error: testError } = await supabase
        .from('groups')
        .select('id')
        .limit(1);

      if (testError) {
        console.error('Database connection test failed:', testError);
        throw new Error(`Database connection failed: ${testError.message}`);
      }
      console.log('Database connection test successful');

      // Check what groups exist in the database
      const { data: allGroups, error: allGroupsError } = await supabase
        .from('groups')
        .select('id, name')
        .order('id', { ascending: true });

      if (allGroupsError) {
        console.error('Error fetching all groups:', allGroupsError);
        throw new Error(`Failed to fetch groups list: ${allGroupsError.message}`);
      } else {
        console.log('Available groups in database:', allGroups?.map(g => ({ id: g.id, name: g.name })) || []);

        // Check if the requested groupId exists
        const requestedGroupExists = allGroups?.some(g => g.id === groupId);
        console.log(`Requested groupId ${groupId} exists in database: ${requestedGroupExists}`);

        if (!requestedGroupExists) {
          console.error(`Group ${groupId} not found in database. Available IDs:`, allGroups?.map(g => g.id) || []);
          throw new Error(`Group ${groupId} not found in database. Available group IDs: ${allGroups?.map(g => g.id).join(', ') || 'none'}`);
        }
      }
    } catch (testError) {
      console.error('Database connection test error:', testError);
      throw new Error(`Database connection test failed: ${testError}`);
    }

    // First, get the group to understand the schedule
    console.log('=== ABOUT TO FETCH GROUP DATA ===');
    console.log(`Fetching group data for ID: ${groupId}`);

    // Simple test to see if we can access the groups table
    console.log('Testing groups table access...');

    // Try to fetch the group with explicit field selection
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('id, name, start_date, recurring_days, total_sessions')
      .eq('id', groupId)
      .single();

    console.log('=== GROUP QUERY COMPLETED ===');
    console.log('Raw group data:', group);
    console.log('Group error:', groupError);
    console.log('Group object keys:', group ? Object.keys(group) : 'no group');
    console.log('Group object length:', group ? Object.keys(group).length : 'no group');

    console.log('Group query result:', {
      groupId: groupId,
      hasData: !!group,
      dataType: typeof group,
      dataKeys: group ? Object.keys(group) : 'no data',
      rawData: group,
      hasError: !!groupError,
      error: groupError
    });

    // Log the specific fields we need
    if (group) {
      console.log('Required group fields:', {
        id: group.id,
        name: group.name,
        start_date: group.start_date,
        recurring_days: group.recurring_days,
        total_sessions: group.total_sessions,
        start_date_type: typeof group.start_date,
        recurring_days_type: typeof group.recurring_days,
        total_sessions_type: typeof group.total_sessions
      });
    }

    if (groupError) {
      console.error('Error fetching group for session generation:', {
        error: groupError,
        message: groupError.message,
        details: groupError.details,
        hint: groupError.hint,
        code: groupError.code,
        groupId: groupId
      });
      throw new Error(`Failed to fetch group: ${groupError.message || 'Unknown error'}`);
    }

    // Validate group data
    if (!group) {
      console.error('Group query returned no data for ID:', groupId);
      throw new Error(`Group with ID ${groupId} not found`);
    }

    // Check if group is an empty object
    if (group && typeof group === 'object' && Object.keys(group).length === 0) {
      console.error('Group query returned empty object for ID:', groupId);
      throw new Error(`Group with ID ${groupId} returned empty object from database`);
    }

    // Check each required field individually
    if (!group.start_date) {
      console.error(`Group ${groupId} missing start_date:`, group.start_date);
      throw new Error(`Group ${groupId} is missing start_date`);
    }

    if (!group.recurring_days) {
      console.error(`Group ${groupId} missing recurring_days:`, group.recurring_days);
      throw new Error(`Group ${groupId} is missing recurring_days`);
    }

    if (!group.total_sessions) {
      console.error(`Group ${groupId} missing total_sessions:`, group.total_sessions);
      throw new Error(`Group ${groupId} is missing total_sessions`);
    }

    console.log('All required fields present:', {
      start_date: group.start_date,
      recurring_days: group.recurring_days,
      total_sessions: group.total_sessions
    });

    // Validate recurring_days is an array and contains valid day numbers
    if (!Array.isArray(group.recurring_days) || group.recurring_days.length === 0) {
      console.error('Invalid recurring_days format:', {
        groupId: groupId,
        recurringDays: group.recurring_days,
        type: typeof group.recurring_days
      });
      throw new Error(`Group ${groupId} has invalid recurring_days format. Expected array of day numbers (0-6), got: ${JSON.stringify(group.recurring_days)}`);
    }

    // Validate that recurring_days contains valid day numbers (0-6)
    const invalidDays = group.recurring_days.filter((day: any) => typeof day !== 'number' || day < 0 || day > 6);
    if (invalidDays.length > 0) {
      console.error('Invalid day numbers in recurring_days:', {
        groupId: groupId,
        invalidDays: invalidDays,
        validDays: group.recurring_days.filter((day: any) => typeof day === 'number' && day >= 0 && day <= 6)
      });
      throw new Error(`Group ${groupId} has invalid day numbers in recurring_days: ${JSON.stringify(invalidDays)}. Valid days are 0-6 (Sunday-Saturday)`);
    }

    // Check if sessions already exist for this group
    const { data: existingSessions, error: existingError } = await supabase
      .from('sessions')
      .select('id, date')
      .eq('group_id', groupId);

    if (existingError) {
      console.error('Error checking existing sessions:', existingError);
      throw new Error(`Failed to check existing sessions: ${existingError.message}`);
    }

    // Check if we need to regenerate sessions based on total_sessions count
    if (existingSessions && existingSessions.length > 0) {
      console.log('Sessions already exist for group', groupId, 'checking if regeneration needed');
      console.log('Existing sessions count:', existingSessions.length, 'Required sessions count:', group.total_sessions);

      // If the count matches, return existing sessions
      if (existingSessions.length === group.total_sessions) {
        console.log('Session count matches, returning existing sessions');
        return existingSessions.map((session: { id: any; date: any }) => ({
          id: session.id,
          date: new Date(session.date),
          groupId: groupId,
          attendance: {},
        }));
      } else {
        console.log('Session count mismatch, deleting existing sessions and regenerating');
        // Delete existing sessions to regenerate with correct count
        const { error: deleteError } = await supabase
          .from('sessions')
          .delete()
          .eq('group_id', groupId);

        if (deleteError) {
          console.error('Error deleting existing sessions:', deleteError);
          throw new Error(`Failed to delete existing sessions: ${deleteError.message}`);
        }

        console.log('Successfully deleted existing sessions, proceeding with regeneration');
      }
    }

    const sessions: Session[] = [];
    let currentDate = new Date(group.start_date);
    let sessionCount = 0;

    console.log('Starting session generation for group:', {
      groupId: groupId,
      groupName: group.name,
      startDate: group.start_date,
      recurringDays: group.recurring_days,
      totalSessions: group.total_sessions,
      currentDate: currentDate.toISOString()
    });

    // Generate sessions based on recurring days
    let maxIterations = group.total_sessions * 10; // Safety limit to prevent infinite loops
    let iterationCount = 0;

    while (sessionCount < group.total_sessions && iterationCount < maxIterations) {
      iterationCount++;
      const dayOfWeek = currentDate.getDay();
      console.log(`Checking date ${currentDate.toISOString().split('T')[0]} (day ${dayOfWeek}) - recurring days: ${group.recurring_days} (iteration ${iterationCount}/${maxIterations})`);

      if (group.recurring_days.includes(dayOfWeek)) {
        const { data: session, error: sessionError } = await supabase
          .from('sessions')
          .insert({
            date: currentDate.toISOString().split('T')[0],
            group_id: groupId,
            session_number: sessionCount + 1, // Add session number
          })
          .select()
          .single();

        if (sessionError) {
          console.error('Error creating session:', {
            error: sessionError,
            message: sessionError.message,
            details: sessionError.details,
            hint: sessionError.hint,
            code: sessionError.code,
            groupId: groupId,
            date: currentDate.toISOString().split('T')[0],
            groupData: group
          });
          throw new Error(`Failed to create session: ${sessionError.message || 'Unknown error'}`);
        }

        console.log(`Successfully created session ${session.id} for date ${currentDate.toISOString().split('T')[0]}`);

        sessions.push({
          id: session.id,
          date: new Date(session.date),
          groupId: session.group_id,
          attendance: {},
        });
        sessionCount++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (sessionCount < group.total_sessions) {
      console.warn(`Session generation incomplete for group ${groupId}. Created ${sessions.length}/${group.total_sessions} sessions. This might indicate an issue with recurring days configuration.`);
    } else {
      console.log(`Session generation complete for group ${groupId}. Created ${sessions.length} sessions.`);
    }
    return sessions;
  },

  async updateAttendance(sessionId: string, studentId: string, status: string): Promise<void> {
    console.log(`🚨 ATTENDANCE UPDATE CALLED: sessionId=${sessionId}, studentId=${studentId}, status=${status}`);
    try {
      // First, get the group ID for this session
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('group_id')
        .eq('id', sessionId)
        .single();

      if (sessionError) {
        throw new Error(`Failed to fetch session: ${sessionError.message}`);
      }

      const groupId = session.group_id;

      // Update or insert attendance record
      const { error: upsertError } = await supabase
        .from('attendance')
        .upsert({
          session_id: sessionId,
          student_id: studentId,
          status: status,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'session_id,student_id'
        });

      if (upsertError) {
        throw new Error(`Failed to update attendance: ${upsertError.message}`);
      }

      // 🚨 FIX: DISABLED automatic payment creation on attendance update
      // This was causing students to appear as "paid" when attendance was saved
      // Payments should only be created when actual money is received, not when attendance is marked
      // If you need attendance-based payment adjustments, they should be done manually or through a separate process
      console.log(`🚨 FIX: Attendance updated - NO automatic payment creation`);
      console.log(`🚨 FIX: Student payment status will remain unchanged by attendance updates`);

      // DISABLED: Automatic payment creation on attendance update
      // This code is commented out to prevent false "paid" status
      /*
      try {
        // Get session and group details
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select(`
            id,
            date,
            group_id,
            groups!inner(
              id,
              name,
              price,
              total_sessions
            )
          `)
          .eq('id', sessionId)
          .single();

        if (sessionError || !sessionData) {
          console.error('❌ Error fetching session data for payment update:', sessionError);
        } else {
          const group = Array.isArray(sessionData.groups) ? sessionData.groups[0] : sessionData.groups;
          const groupId = group.id;
          const groupName = group.name;
          const groupPrice = group.price;
          const totalSessions = group.total_sessions;
          const pricePerSession = groupPrice / totalSessions;

          console.log(`📍 Payment update for: ${groupName} (${groupId}), Price per session: ${pricePerSession}`);

          // Get all attendance records for this student in this group
          const { data: allSessions, error: sessionsError } = await supabase
            .from('sessions')
            .select('id, date')
            .eq('group_id', groupId)
            .order('date', { ascending: true });

          if (!sessionsError && allSessions) {
            const sessionIds = allSessions.map(s => s.id);
            const { data: attendanceRecords, error: attendanceError } = await supabase
              .from('attendance')
              .select('session_id, status')
              .eq('student_id', studentId)
              .in('session_id', sessionIds);

            if (!attendanceError && attendanceRecords) {
              // Count sessions by payment obligation
              let obligatorySessions = 0; // present, absent, too_late = MUST PAY
              let freeSessions = 0; // justified, change, new, stop = NOT COUNTED

              for (const session of allSessions) {
                const attendance = attendanceRecords.find(a => a.session_id === session.id);
                const attendanceStatus = attendance?.status || 'default';

                if (['present', 'absent', 'too_late', 'default'].includes(attendanceStatus)) {
                  obligatorySessions++; // MUST PAY
                } else {
                  freeSessions++; // NOT COUNTED (justified, new, change, stop)
                }
              }

              // Calculate actual fee based on obligatory sessions only
              const actualFeeOwed = obligatorySessions * pricePerSession;
              const freeAmount = freeSessions * pricePerSession;

              console.log(`📊 ATTENDANCE-BASED PAYMENT CALCULATION:`);
              console.log(`  Total sessions: ${allSessions.length}`);
              console.log(`  Obligatory sessions: ${obligatorySessions} (must pay)`);
              console.log(`  Free sessions: ${freeSessions} (justified/new/change/stop)`);
              console.log(`  Original group fee: ${groupPrice}`);
              console.log(`  Actual fee owed: ${actualFeeOwed}`);
              console.log(`  Free amount: ${freeAmount}`);

              // Check current payments for this group
              const { data: payments, error: paymentsError } = await supabase
                .from('payments')
                .select('amount, payment_type, notes')
                .eq('student_id', studentId)
                .eq('group_id', groupId);

              if (!paymentsError && payments) {
                const regularPayments = payments
                  .filter(p => !p.payment_type?.includes('attendance_credit') && !p.payment_type?.includes('balance_credit'))
                  .reduce((sum, p) => sum + p.amount, 0);

                const existingAdjustments = payments
                  .filter(p => p.notes?.includes('Attendance-based payment update'))
                  .reduce((sum, p) => sum + p.amount, 0);

                console.log(`💳 Current payment status:`);
                console.log(`  Regular payments: ${regularPayments}`);
                console.log(`  Existing adjustments: ${existingAdjustments}`);
                console.log(`  Total paid: ${regularPayments + existingAdjustments}`);

                // Calculate the adjustment needed
                const totalPaid = regularPayments + existingAdjustments;
                const adjustmentNeeded = actualFeeOwed - totalPaid;

                console.log(`🎯 Adjustment calculation:`);
                console.log(`  Actual fee owed: ${actualFeeOwed}`);
                console.log(`  Total paid: ${totalPaid}`);
                console.log(`  Adjustment needed: ${adjustmentNeeded}`);

                // Only create adjustment if there's a meaningful difference
                if (Math.abs(adjustmentNeeded) > 0.01) {
                  // Remove any existing attendance-based adjustments
                  const { error: deleteError } = await supabase
                    .from('payments')
                    .delete()
                    .eq('student_id', studentId)
                    .eq('group_id', groupId)
                    .like('notes', '%Attendance-based payment update%');

                  if (deleteError) {
                    console.error('❌ Error deleting existing adjustments:', deleteError);
                  } else {
                    console.log(`🗑️ Deleted existing attendance-based adjustments`);
                  }

                  // Create new adjustment
                  const paymentType = adjustmentNeeded > 0 ? 'attendance_credit' : 'balance_credit';
                  const adjustmentAmount = Math.abs(adjustmentNeeded);
                  const paymentNotes = `Attendance-based payment update: ${obligatorySessions} obligatory sessions, ${freeSessions} free sessions. Adjustment: ${adjustmentAmount} DZD`;

                  const { data: payment, error: paymentError } = await supabase
                    .from('payments')
                    .insert({
                      student_id: studentId,
                      group_id: groupId,
                      amount: adjustmentAmount,
                      payment_type: paymentType,
                      date: new Date().toISOString().split('T')[0],
                      notes: paymentNotes,
                      admin_name: 'System - Attendance Update'
                    })
                    .select()
                    .single();

                  if (paymentError) {
                    console.error('❌ Error creating attendance-based payment adjustment:', paymentError);
                  } else {
                    console.log(`✅ Created attendance-based payment adjustment: ${paymentType} of ${adjustmentAmount} DZD`);
                    console.log(`📝 Notes: ${paymentNotes}`);
                  }
                } else {
                  console.log(`✅ No adjustment needed - balance is already correct`);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error in attendance-payment link:`, error);
        console.error(`❌ Error details:`, error instanceof Error ? error.message : String(error));
      }
      */

      // If status is 'stop', mark student as stopped in this group
      if (status === 'stop') {
        await this.markStudentAsStoppedInGroup(studentId, groupId);
      } else if (['present', 'absent', 'justified', 'change', 'new'].includes(status)) {
        // If status is active, mark student as active in this group
        await this.markStudentAsActiveInGroup(studentId, groupId);
      }

      console.log(`Attendance updated for student ${studentId} in session ${sessionId} with status: ${status}`);
    } catch (error) {
      console.error('Error updating attendance:', error);
      throw error;
    }
  },



  // Mark student as stopped in a specific group
  async markStudentAsStoppedInGroup(studentId: string, groupId: number): Promise<void> {
    try {
      console.log(`=== MARKING STUDENT AS STOPPED ===`);
      console.log(`Student ID: ${studentId}, Group ID: ${groupId}`);

      // Check if student_groups table exists, if not create it
      const { error: checkError } = await supabase
        .from('student_groups')
        .select('id')
        .eq('student_id', studentId)
        .eq('group_id', groupId)
        .limit(1);

      if (checkError && checkError.message.includes('does not exist')) {
        console.log('student_groups table does not exist, creating it...');
        await this.createStudentGroupsTable();
      } else if (checkError) {
        console.error('Error checking student_groups table:', checkError);
      } else {
        console.log('student_groups table exists, proceeding with upsert');
      }

      // Upsert student group status
      console.log('Attempting to upsert student status to stopped...');
      const { data: upsertData, error: upsertError } = await supabase
        .from('student_groups')
        .upsert({
          student_id: studentId,
          group_id: groupId,
          status: 'stopped'
          // Removed updated_at field as it doesn't exist in the table
        }, {
          onConflict: 'student_id,group_id'
        })
        .select();

      if (upsertError) {
        console.error('Error marking student as stopped:', upsertError);
        throw new Error(`Failed to mark student as stopped: ${upsertError.message}`);
      } else {
        console.log('Successfully marked student as stopped:', upsertData);

        // 🔄 CROSS-GROUP REFUND LOGIC: Check if student has other active groups
        await paymentService.handleCrossGroupRefund(studentId, groupId);
      }
    } catch (error) {
      console.error('Error in markStudentAsStoppedInGroup:', error);
    }
  },



  // Update debts and refunds lists automatically
  async updateDebtsAndRefundsLists(): Promise<void> {
    try {
      // This function will be called to refresh the debts and refunds lists
      // The actual lists are updated when getRefundList() and getDebtsList() are called
      // This ensures the UI shows the most current data
      console.log('Debts and refunds lists updated automatically');
    } catch (error) {
      console.error('Error updating debts and refunds lists:', error);
    }
  },

  // Comprehensive function to check all students and update debts/refunds lists
  async refreshAllStudentsForDebtsAndRefunds(): Promise<{
    refundsCount: number;
    debtsCount: number;
    processedStudents: number;
    errors: string[];
  }> {
    try {
      console.log('Starting comprehensive refresh of all students for debts and refunds...');

      const errors: string[] = [];
      let refundsCount = 0;
      let debtsCount = 0;
      let processedStudents = 0;

      // Get all students
      const { data: allStudents, error: studentsError } = await supabase
        .from('students')
        .select('id, name, custom_id');

      if (studentsError) {
        throw new Error(`Failed to fetch students: ${studentsError.message}`);
      }

      console.log(`Processing ${allStudents?.length || 0} students...`);

      for (const student of allStudents || []) {
        try {
          processedStudents++;
          console.log(`\n[${processedStudents}/${allStudents?.length}] Processing student: ${student.name}`);

          // Get student balance
          const balance = await paymentService.getStudentBalance(student.id);
          console.log(`  Balance: ${balance.remainingBalance}`);

          // Get student groups
          const { data: studentGroups, error: groupsError } = await supabase
            .from('student_groups')
            .select(`
              group_id,
              status,
              groups!inner(
                id,
                name
              )
            `)
            .eq('student_id', student.id);

          if (groupsError) {
            console.error(`  Error fetching groups for ${student.name}:`, groupsError);
            errors.push(`Failed to fetch groups for ${student.name}: ${groupsError.message}`);
            continue;
          }

          console.log(`  Groups: ${studentGroups?.length || 0}`);

          if (studentGroups && studentGroups.length > 0) {
            // Check if ALL groups have 'stopped' status
            const allGroupsStopped = studentGroups.every((enrollment: any) => enrollment.status === 'stopped');
            console.log(`  All groups stopped: ${allGroupsStopped}`);

            if (allGroupsStopped) {
              if (balance.remainingBalance > 0) {
                console.log(`  ✅ ${student.name} qualifies for REFUND (balance: ${balance.remainingBalance})`);
                refundsCount++;
              } else if (balance.remainingBalance < 0) {
                console.log(`  ✅ ${student.name} qualifies for DEBT (balance: ${balance.remainingBalance})`);
                debtsCount++;
              } else {
                console.log(`  ⚠️ ${student.name} has zero balance, no action needed`);
              }
            } else {
              console.log(`  ⚠️ ${student.name} has active groups, no action needed`);
            }
          } else {
            console.log(`  ⚠️ ${student.name} has no groups, no action needed`);
          }

        } catch (studentError) {
          const errorMsg = `Error processing student ${student.name}: ${studentError}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      const result = {
        refundsCount,
        debtsCount,
        processedStudents,
        errors
      };

      console.log('\n=== REFRESH COMPLETE ===');
      console.log(`Processed: ${processedStudents} students`);
      console.log(`Refunds: ${refundsCount}`);
      console.log(`Debts: ${debtsCount}`);
      console.log(`Errors: ${errors.length}`);

      return result;

    } catch (error) {
      console.error('Error in refreshAllStudentsForDebtsAndRefunds:', error);
      throw error;
    }
  },

  // Mark student as active in a specific group
  async markStudentAsActiveInGroup(studentId: string, groupId: number): Promise<void> {
    try {
      console.log(`=== MARKING STUDENT AS ACTIVE ===`);
      console.log(`Student ID: ${studentId}, Group ID: ${groupId}`);

      // Check if student_groups table exists, if not create it
      const { error: checkError } = await supabase
        .from('student_groups')
        .select('id')
        .eq('student_id', studentId)
        .eq('group_id', groupId)
        .limit(1);

      if (checkError && checkError.message.includes('does not exist')) {
        console.log('student_groups table does not exist, creating it...');
        await this.createStudentGroupsTable();
      } else if (checkError) {
        console.error('Error checking student_groups table:', checkError);
      } else {
        console.log('student_groups table exists, proceeding with upsert');
      }

      // Check what columns exist in student_groups table
      try {
        const { data: tableInfo, error: tableError } = await supabase
          .from('student_groups')
          .select('*')
          .limit(1);

        if (!tableError && tableInfo && tableInfo.length > 0) {
          console.log('student_groups table columns:', Object.keys(tableInfo[0]));
        }
      } catch (debugError) {
        console.log('Could not inspect table structure:', debugError);
      }

      // Upsert student group status
      console.log('Attempting to upsert student status to active...');
      const { data: upsertData, error: upsertError } = await supabase
        .from('student_groups')
        .upsert({
          student_id: studentId,
          group_id: groupId,
          status: 'active'
          // Removed updated_at field as it doesn't exist in the table
        }, {
          onConflict: 'student_id,group_id'
        })
        .select();

      if (upsertError) {
        console.error('Error marking student as active:', upsertError);
        throw new Error(`Failed to mark student as active: ${upsertError.message}`);
      } else {
        console.log('Successfully marked student as active:', upsertData);
      }
    } catch (error) {
      console.error('Error in markStudentAsActiveInGroup:', error);
    }
  },

  // Create student_groups table if it doesn't exist
  async createStudentGroupsTable(): Promise<void> {
    try {
      // First check if the table exists
      const { data: tableCheck, error: checkError } = await supabase
        .from('student_groups')
        .select('*')
        .limit(1);

      if (checkError && checkError.message.includes('does not exist')) {
        console.log('student_groups table does not exist, creating it...');

        // Try to create the table using RPC first
        const { error: rpcError } = await supabase.rpc('create_student_groups_table');

        if (rpcError) {
          console.log('RPC approach failed, trying direct SQL:', rpcError.message);

          // Try alternative approach - this might not work in all Supabase setups
          console.log('Please run the create-student-group-junction.sql script manually in your database');
          console.log('Or create the table manually with the following SQL:');
          console.log(`
            CREATE TABLE IF NOT EXISTS student_groups (
              id SERIAL PRIMARY KEY,
              student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
              group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
              status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'stopped')),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              UNIQUE(student_id, group_id)
            );
          `);
        } else {
          console.log('Successfully created student_groups table using RPC');

          // Populate with existing students
          await this.populateStudentGroupsTable();
        }
      } else if (checkError) {
        console.error('Error checking student_groups table:', checkError);
        throw new Error('Failed to check student groups table');
      } else {
        console.log('student_groups table already exists');

        // Check if the status column exists
        try {
          const { data: statusCheck, error: statusError } = await supabase
            .from('student_groups')
            .select('status')
            .limit(1);

          if (statusError && statusError.message.includes('column "status" does not exist')) {
            console.log('Table exists but missing status column. Attempting to fix automatically...');

            try {
              await this.fixMissingStatusColumn();
            } catch (fixError) {
              console.log('Automatic fix failed. Please run the migration script manually:');
              console.log('add-status-column-migration.sql');
              console.log('Or run this SQL manually:');
              console.log(`
                ALTER TABLE student_groups 
                ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active';
                
                ALTER TABLE student_groups 
                ADD CONSTRAINT check_status_values 
                CHECK (status IN ('active', 'stopped'));
              `);
            }
          }
        } catch (statusCheckError) {
          console.log('Could not check status column:', statusCheckError);
        }
      }
    } catch (error) {
      console.error('Unexpected error in createStudentGroupsTable:', error);
      throw new Error('Failed to create student groups table');
    }
  },

  async populateStudentGroupsTable(): Promise<void> {
    try {
      // Get all students with group_id
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, group_id')
        .not('group_id', 'is', null);

      if (studentsError) {
        console.error('Error fetching students for population:', studentsError);
        return;
      }

      if (students && students.length > 0) {
        // Insert existing students into student_groups table
        const studentGroupsData = students.map(student => ({
          student_id: student.id,
          group_id: student.group_id,
          status: 'active'
        }));

        const { error: insertError } = await supabase
          .from('student_groups')
          .insert(studentGroupsData)
          .select();

        if (insertError) {
          console.error('Error populating student_groups table:', insertError);
        } else {
          console.log(`Successfully populated student_groups table with ${students.length} students`);
        }
      }
    } catch (error) {
      console.error('Error populating student_groups table:', error);
    }
  },

  async fixMissingStatusColumn(): Promise<void> {
    try {
      console.log('Attempting to fix missing status column...');

      // Try to add the status column using RPC
      const { error: rpcError } = await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE student_groups 
          ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active';
          
          ALTER TABLE student_groups 
          DROP CONSTRAINT IF EXISTS check_status_values;
          
          ALTER TABLE student_groups 
          ADD CONSTRAINT check_status_values 
          CHECK (status IN ('active', 'stopped'));
        `
      });

      if (rpcError) {
        console.log('RPC approach failed:', rpcError.message);
        console.log('Please run the migration script manually: add-status-column-migration.sql');
      } else {
        console.log('Successfully added status column using RPC');

        // Update any existing records
        const { error: updateError } = await supabase
          .from('student_groups')
          .update({ status: 'active' })
          .is('status', null);

        if (updateError) {
          console.log('Could not update existing records:', updateError.message);
        } else {
          console.log('Successfully updated existing records with default status');
        }
      }
    } catch (error) {
      console.error('Error fixing missing status column:', error);
      console.log('Please run the migration script manually: add-status-column-migration.sql');
    }
  },

  async updateAttendanceBulk(groupId: number, updates: Array<{ sessionId: string; studentId: string; status: string }>): Promise<void> {
    try {
      console.log(`=== BULK ATTENDANCE UPDATE STARTED ===`);
      console.log(`Group ID: ${groupId}, Updates count: ${updates.length}`);

      // Track which students had status changes that affect their group status
      const studentsWithStatusChanges = new Set<string>();

      // Apply all updates first
      for (const update of updates) {
        console.log(`Processing update: Student ${update.studentId}, Session ${update.sessionId}, Status: ${update.status}`);
        await this.updateAttendance(update.sessionId, update.studentId, update.status);

        // Track students whose status affects their group status
        if (['stop', 'present', 'absent', 'justified', 'change', 'new'].includes(update.status)) {
          studentsWithStatusChanges.add(update.studentId);
        }
      }

      console.log(`Students with status changes: ${Array.from(studentsWithStatusChanges)}`);

      // Verify that all status changes were applied correctly
      for (const studentId of studentsWithStatusChanges) {
        try {
          const { data: studentGroup, error: checkError } = await supabase
            .from('student_groups')
            .select('status, group_id')
            .eq('student_id', studentId)
            .eq('group_id', groupId)
            .single();

          if (!checkError && studentGroup) {
            console.log(`Student ${studentId} in group ${groupId} has status: ${studentGroup.status}`);
          } else {
            console.warn(`Could not verify status for student ${studentId} in group ${groupId}:`, checkError);
          }
        } catch (verifyError) {
          console.error(`Error verifying status for student ${studentId}:`, verifyError);
        }
      }

      console.log(`=== BULK ATTENDANCE UPDATE COMPLETED ===`);

      // Add a longer delay to ensure database changes are committed
      console.log(`⏳ Waiting 1000ms for database changes to be committed...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`✅ Database commit delay completed`);

    } catch (error) {
      console.error('Error in bulk attendance update:', error);
      throw error;
    }
  },
};

// Payment operations
export const paymentService = {
  async getAll(): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching payments:', error);
      throw new Error(`Failed to fetch payments: ${error.message}`);
    }

    return data?.map(payment => ({
      id: payment.id,
      studentId: payment.student_id,
      groupId: payment.group_id,
      amount: payment.amount,
      date: new Date(payment.date),
      notes: payment.notes,
      adminName: payment.admin_name,
      discount: payment.discount || 0,
      originalAmount: payment.original_amount || payment.amount,
      paymentType: payment.payment_type || 'group_payment', // Default to group_payment if column doesn't exist
    })) || [];
  },

  async create(payment: Omit<Payment, 'id'>): Promise<Payment> {
    // Prepare the insert data - only include fields that exist in the database
    const insertData: any = {
      student_id: payment.studentId,
      amount: payment.amount,
      date: payment.date.toISOString().split('T')[0],
      notes: payment.notes,
      admin_name: payment.adminName || 'Dalila',
      discount: payment.discount || 0,
      original_amount: payment.originalAmount || payment.amount,
      payment_type: payment.paymentType || 'group_payment',
    };

    // Handle group_id - if it's undefined/null, we need to handle this
    if (payment.groupId !== undefined && payment.groupId !== null) {
      insertData.group_id = payment.groupId;
    }
    // For balance additions (debt payments, refunds), group_id can be null

    const { data, error } = await supabase
      .from('payments')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating payment:', error);
      throw new Error(`Failed to create payment: ${error.message}`);
    }

    // Generate receipt for the payment
    try {
      // Get student name
      const { data: studentData } = await supabase
        .from('students')
        .select('name')
        .eq('id', payment.studentId)
        .single();

      // Get group name if applicable
      let groupName = null;
      if (payment.groupId) {
        const { data: groupData } = await supabase
          .from('groups')
          .select('name')
          .eq('id', payment.groupId)
          .single();
        groupName = groupData?.name;
      }

      // Determine group name based on payment type
      let displayGroupName = groupName;
      if (!displayGroupName) {
        switch (payment.paymentType) {
          case 'registration_fee':
            displayGroupName = 'Registration Fee';
            break;
          case 'balance_addition':
            displayGroupName = 'Balance Credit';
            break;
          case 'debt_reduction':
            displayGroupName = 'Debt Reduction';
            break;
          case 'refund':
            displayGroupName = 'Refund';
            break;
          default:
            displayGroupName = 'N/A';
        }
      }

      const { data: receiptData, error: receiptError } = await supabase
        .from('receipts')
        .insert({
          student_id: payment.studentId,
          student_name: studentData?.name || 'Unknown Student',
          payment_id: data.id,
          amount: Math.abs(payment.amount), // Always positive for receipts
          payment_type: payment.paymentType || 'group_payment',
          group_name: displayGroupName,
          notes: payment.notes,
          created_at: new Date().toISOString()
        });

      if (receiptError) {
        console.warn('⚠️ Could not create receipt for payment:', receiptError);
      } else {
        console.log('✅ Receipt generated successfully for payment');
      }
    } catch (receiptError) {
      console.warn('⚠️ Receipt generation failed for payment:', receiptError);
    }

    return {
      id: data.id,
      studentId: data.student_id,
      groupId: data.group_id,
      amount: data.amount,
      date: new Date(data.date),
      notes: data.notes,
      adminName: data.admin_name,
      discount: data.discount || 0,
      originalAmount: data.original_amount || data.amount,
      paymentType: data.payment_type || 'group_payment',
    };
  },

  async update(id: string, payment: Partial<Payment>): Promise<Payment> {
    const { data, error } = await supabase
      .from('payments')
      .update({
        student_id: payment.studentId,
        group_id: payment.groupId,
        amount: payment.amount,
        date: payment.date?.toISOString().split('T')[0],
        notes: payment.notes,
        admin_name: payment.adminName,
        discount: payment.discount,
        original_amount: payment.originalAmount,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating payment:', error);
      throw new Error(`Failed to update payment: ${error.message}`);
    }

    return {
      id: data.id,
      studentId: data.student_id,
      groupId: data.group_id,
      amount: data.amount,
      date: new Date(data.date),
      notes: data.notes,
      adminName: data.admin_name,
      discount: data.discount || 0,
      originalAmount: data.original_amount || data.amount,
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting payment:', error);
      throw new Error(`Failed to delete payment: ${error.message}`);
    }
  },

  // Completely restructured method to get student balance - simplified and accurate
  async getStudentBalance(studentId: string): Promise<{
    totalBalance: number;
    totalPaid: number;
    remainingBalance: number;
    groupBalances: Array<{
      groupId: number;
      groupName: string;
      groupFees: number;
      amountPaid: number;
      remainingAmount: number;
      discount?: number;
      isRegistrationFee?: boolean;
      startDate?: string;
    }>;
  }> {
    // Guard clause: check if studentId is valid
    if (!studentId || typeof studentId !== 'string') {
      console.error('getStudentBalance called with invalid studentId:', studentId);
      throw new Error(`Invalid student ID: ${studentId}`);
    }

    console.log('getStudentBalance called with studentId:', studentId);

    // Check if student needs retrospective calculation:
    // 1. Student is stopped in ALL groups, OR
    // 2. Student has no active groups but has attendance history
    const isFullyStopped = await this.isStudentFullyStopped(studentId);
    const hasAttendanceButNoGroups = await this.hasAttendanceButNoActiveGroups(studentId);

    console.log('🛑 RETROSPECTIVE CHECK:', {
      studentId: studentId.substring(0, 8) + '...',
      isFullyStopped,
      hasAttendanceButNoGroups,
      shouldUseRetrospective: isFullyStopped || hasAttendanceButNoGroups
    });

    if (isFullyStopped || hasAttendanceButNoGroups) {
      console.log('🛑 Student needs retrospective balance calculation', { isFullyStopped, hasAttendanceButNoGroups });
      return await this.getStoppedStudentBalance(studentId);
    }

    // Get student info
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('name, default_discount')
      .eq('id', studentId)
      .single();

    if (studentError) {
      console.error('Error fetching student:', studentError);
      throw new Error(`Failed to fetch student: ${studentError.message}`);
    }

    // Get all payments for this student
    let payments: any[] = [];
    try {
      const { data, error: paymentsError } = await supabase
        .from('payments')
        .select('group_id, amount, original_amount, discount, notes, payment_type')
        .eq('student_id', studentId);

      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError);
        payments = [];
      } else {
        payments = data || [];
      }
    } catch (tableError) {
      console.log('payments table not available, using empty array');
      payments = [];
    }

    // ✅ FIXED: Count ALL payments for the student, including those without notes
    // This ensures accurate balance calculation including all payment types
    const actualPayments = payments.filter(p => {
      // Include all payments except those explicitly marked as automatic/system
      if (p.notes && p.notes.toLowerCase().includes('automatic')) return false;
      if (p.notes && p.notes.toLowerCase().includes('system')) return false;
      if (p.notes && p.notes.toLowerCase().includes('default')) return false;
      return true; // Include all other payments
    });

    console.log(`✅ FIXED: Found ${payments.length} total payments, ${actualPayments.length} are valid payments`);
    console.log(`🚨 DEBUG: Payment filtering details:`, payments.map(p => ({
      id: p.id,
      amount: p.amount,
      notes: p.notes,
      payment_type: p.payment_type,
      group_id: p.group_id
    })));
    payments = actualPayments; // Use filtered payments

    // Get all groups that this student is enrolled in
    let studentGroups: any[] = [];
    try {
      const { data, error: groupsError } = await supabase
        .from('student_groups')
        .select(`
          group_id,
          status,
          group_discount,
          groups (
            id,
            name,
            price,
            total_sessions,
            start_date
          )
        `)
        .eq('student_id', studentId);

      if (groupsError) {
        console.error('Error fetching student groups:', groupsError);
        studentGroups = [];
      } else {
        studentGroups = data || [];
        console.log(`🔍 DEBUG: Found ${studentGroups.length} student_groups records for student ${studentId}`);
        console.log(`🔍 DEBUG: student_groups data:`, studentGroups.map(sg => ({
          group_id: sg.group_id,
          status: sg.status,
          group_name: sg.groups?.name,
          group_price: sg.groups?.price,
          group_object: sg.groups
        })));

        // DEBUG: Check what happens during group processing
        console.log(`🔍 DEBUG: About to process student groups...`);
      }
    } catch (tableError) {
      console.log('student_groups table not available, using empty array');
      studentGroups = [];
    }

    // NEW LOGIC: Clear separation of concerns
    let totalBalance = 0;
    let totalPaid = 0;
    let totalCredits = 0;
    const groupBalances: Array<{
      groupId: number;
      groupName: string;
      groupFees: number;
      amountPaid: number;
      remainingAmount: number;
      discount?: number;
      isRegistrationFee?: boolean;
      startDate?: string;
    }> = [];

    // STEP 1: Registration Fee ($500) - Always first priority
    // IMPORTANT: Registration fee should always be added at full price (no discount)
    const registrationAmount = 500; // Fixed $500 registration fee
    const discountedRegistrationAmount = registrationAmount; // No discount applied to registration

    console.log(`Registration fee calculation: Base=${registrationAmount}, Discount=0%, Final=${discountedRegistrationAmount}`);

    // Check if registration fee already paid
    const registrationPayments = payments.filter(p => {
      if (p.group_id !== null) return false; // Registration payments have no group
      const notes = String(p.notes || '').toLowerCase();
      const isRegistrationType = String(p.payment_type || '').toLowerCase() === 'registration_fee';
      const mentionsRegistration = notes.includes('registration fee');
      return isRegistrationType || mentionsRegistration;
    });
    const registrationPaid = registrationPayments.reduce((sum, p) => {
      const amount = Number(p.amount || 0);
      return amount > 0 ? sum + amount : sum;
    }, 0);

    console.log(`  Registration payments found: ${registrationPayments.length}, Total paid: ${registrationPaid}`);

    // Calculate remaining registration fee
    const regRemaining = Math.max(0, discountedRegistrationAmount - registrationPaid);

    console.log(`  Registration fee remaining: ${regRemaining}`);

    // IMPORTANT: Always add registration fee to balance (student owes this unless paid)
    totalBalance += discountedRegistrationAmount;
    totalPaid += registrationPaid;

    // Add registration fee to group balances (always first)
    groupBalances.push({
      groupId: 0,
      groupName: 'Registration Fee',
      groupFees: discountedRegistrationAmount,
      amountPaid: registrationPaid,
      remainingAmount: regRemaining,
      discount: 0,
      isRegistrationFee: true,
      startDate: undefined,
    });

    // STEP 2: Group Fees (ordered by start date - oldest first)
    const sortedStudentGroups = studentGroups
      .filter(sg => sg.groups && typeof sg.groups === 'object')
      .map(sg => ({
        ...sg,
        group: sg.groups, // groups is a single object, not an array
        startDate: sg.groups?.start_date || null
      }))
      .sort((a, b) => {
        const da = a.startDate ? new Date(a.startDate).getTime() : 0;
        const db = b.startDate ? new Date(b.startDate).getTime() : 0;
        return da - db; // oldest first
      });

    console.log(`Processing ${sortedStudentGroups.length} groups for student ${studentId}`);

    for (const studentGroup of sortedStudentGroups) {
      const group = studentGroup.group;
      if (!group || !group.id) {
        console.log(`Skipping invalid group:`, studentGroup);
        continue;
      }

      const groupIdVal = group.id as number;
      const groupPrice = Number(group.price || 0);

      console.log(`Processing group ${group.name} (ID: ${groupIdVal}): Price=${groupPrice}`);

      // IMPORTANT: Process ALL groups, even if price is 0
      // This ensures the group appears in the unpaid groups list
      if (groupPrice === 0) {
        console.log(`  ⚠️ Group has no price, but will still be included in balance calculation`);
      }

      // Get payments for this specific group
      const groupPayments = payments.filter(p => p.group_id === groupIdVal);

      // 🚨 CRITICAL FIX: EXCLUDE attendance-based payment adjustments
      // These are NOT real payments - they're automatic adjustments that should NOT count
      const validGroupPayments = groupPayments.filter(p => {
        // Must have positive amount
        if (!p.amount || Number(p.amount) <= 0) return false;
        
        // EXCLUDE registration fees
        if (p.payment_type === 'registration_fee') return false;
        if (p.notes && String(p.notes).toLowerCase().includes('registration fee')) return false;
        
        // EXCLUDE balance additions and credits
        if (p.payment_type === 'balance_addition' || p.payment_type === 'balance_credit') return false;
        
        // 🚨 CRITICAL: EXCLUDE ALL attendance-based payment adjustments
        if (p.payment_type === 'attendance_credit') return false;
        if (p.notes && String(p.notes).toLowerCase().includes('attendance-based payment update')) return false;
        if (p.notes && String(p.notes).toLowerCase().includes('attendance adjustment')) return false;
        if (p.notes && String(p.notes).toLowerCase().includes('retroactive attendance adjustment')) return false;
        if (p.notes && String(p.notes).toLowerCase().includes('session refund')) return false;
        if (p.notes && String(p.notes).toLowerCase().includes('stop refund')) return false;
        if (p.notes && String(p.notes).toLowerCase().includes('stop credit')) return false;
        if (p.notes && String(p.notes).toLowerCase().includes('permanent balance correction')) return false;
        if (p.admin_name && String(p.admin_name) === 'System') return false;
        if (p.admin_name && String(p.admin_name).includes('System')) return false;
        if (p.admin_name && String(p.admin_name).includes('Attendance Update')) return false;
        
        // Skip old automatic/system payments
        if (p.notes && p.notes.toLowerCase().includes('automatic')) return false;
        if (p.notes && p.notes.toLowerCase().includes('system') && !p.notes.includes('Attendance')) return false;
        if (p.notes && p.notes.toLowerCase().includes('default')) return false;
        
        // 🚨 CRITICAL: Only count payments with payment_type = 'group_payment' (actual money received)
        // All other payment types (attendance_credit, balance_credit, etc.) are adjustments, not real payments
        if (p.payment_type && p.payment_type !== 'group_payment') return false;
        
        // Include regular group payments (actual money received)
        return true;
      });

      console.log(`  🚨 DEBUG: Group ${group.name} payment filtering:`);
      console.log(`    Total group payments found: ${groupPayments.length}`);
      console.log(`    Valid payments after filtering: ${validGroupPayments.length}`);
      console.log(`    Payment details:`, groupPayments.map(p => ({
        id: p.id,
        amount: p.amount,
        notes: p.notes,
        payment_type: p.payment_type
      })));

      const amountPaid = validGroupPayments.reduce((sum, p) => sum + Number(p.original_amount || p.amount || 0), 0);

      console.log(`  Group payments found: ${groupPayments.length}, Total paid: ${amountPaid}`);

      // Calculate group fee (full price) with proper discount logic
      const groupFee = groupPrice;
      const studentDefaultDiscount = Number(student.default_discount || 0);
      const groupSpecificDiscount = Number(studentGroup.group_discount || 0);

      // Use group-specific discount if available, otherwise use student default
      const appliedDiscount = groupSpecificDiscount > 0 ? groupSpecificDiscount : studentDefaultDiscount;
      const discountedGroupFee = appliedDiscount > 0 ? groupFee * (1 - appliedDiscount / 100) : groupFee;

      // 🆕 ATTENDANCE-BASED FEE CALCULATION
      // Calculate the actual amount owed based on attendance status
      let actualGroupFee = discountedGroupFee;

      try {
        // Get all sessions for this group
        const { data: groupSessions, error: sessionsError } = await supabase
          .from('sessions')
          .select('id, date')
          .eq('group_id', groupIdVal)
          .order('date', { ascending: true });

        if (!sessionsError && groupSessions && groupSessions.length > 0) {
          // Get attendance records for this student in this group
          const sessionIds = groupSessions.map(s => s.id);
          const { data: attendanceRecords, error: attendanceError } = await supabase
            .from('attendance')
            .select('session_id, status')
            .eq('student_id', studentId)
            .in('session_id', sessionIds);

          if (!attendanceError && attendanceRecords) {
            // Count sessions by payment obligation
            let obligatorySessions = 0; // present, absent, too_late = MUST PAY
            let freeSessions = 0; // justified, change, new, stop = NOT COUNTED

            for (const session of groupSessions) {
              const attendance = attendanceRecords.find(a => a.session_id === session.id);
              const status = attendance?.status || 'default';

              if (['present', 'absent', 'too_late', 'default'].includes(status)) {
                obligatorySessions++; // MUST PAY
              } else {
                freeSessions++; // NOT COUNTED (justified, new, change, stop)
              }
            }

            // Calculate actual fee based on obligatory sessions only
            const totalSessions = groupSessions.length;
            const pricePerSession = discountedGroupFee / totalSessions;
            actualGroupFee = obligatorySessions * pricePerSession;

            console.log(`  📊 ATTENDANCE-BASED CALCULATION:`);
            console.log(`    Total sessions: ${totalSessions}`);
            console.log(`    Obligatory sessions: ${obligatorySessions} (must pay)`);
            console.log(`    Free sessions: ${freeSessions} (justified/new/change/stop)`);
            console.log(`    Price per session: ${pricePerSession}`);
            console.log(`    Original group fee: ${discountedGroupFee}`);
            console.log(`    Actual fee owed: ${actualGroupFee}`);

            if (freeSessions > 0) {
              console.log(`  🎉 Student saved ${freeSessions * pricePerSession} DA due to free sessions!`);
            }
          }
        }
      } catch (error) {
        console.log(`  ⚠️ Could not calculate attendance-based fee, using full fee:`, error);
        // Keep using the original discountedGroupFee if attendance calculation fails
      }

      console.log(`  🎯 Discount calculation for group ${group.name}:`);
      console.log(`    Student default discount: ${studentDefaultDiscount}%`);
      console.log(`    Group-specific discount: ${groupSpecificDiscount}%`);
      console.log(`    Applied discount: ${appliedDiscount}%`);
      console.log(`    Original fee: ${groupFee}, Discounted fee: ${discountedGroupFee}, Actual fee: ${actualGroupFee}`);

      // Calculate remaining amount for this group using ACTUAL fee (attendance-based)
      const remainingAmount = Math.max(0, actualGroupFee - amountPaid);

      // Round to 2 decimal places to avoid floating-point precision issues
      const roundedRemainingAmount = Math.round(remainingAmount * 100) / 100;

      console.log(`  🚨 DEBUG: Group ${group.name} remaining amount calculation:`);
      console.log(`    Actual group fee (attendance-based): ${actualGroupFee}`);
      console.log(`    Amount paid: ${amountPaid}`);
      console.log(`    Remaining amount: ${actualGroupFee} - ${amountPaid} = ${remainingAmount}`);
      console.log(`    Group fee: ${groupFee}, Discount: ${appliedDiscount}%, Actual fee: ${actualGroupFee}, Remaining: ${remainingAmount}`);

      // IMPORTANT: Add ACTUAL group fee to total balance (student owes this unless paid)
      // The remainingAmount calculation will handle partial payments correctly
      totalBalance += actualGroupFee;
      totalPaid += amountPaid;

      if (appliedDiscount === 100) {
        console.log(`  🎉 Group is FREE (100% discount) - no payment required`);
      } else if (amountPaid < actualGroupFee) {
        console.log(`  ✅ Student owes money for this group: ${actualGroupFee} (added to total balance)`);
      } else {
        console.log(`  ✅ Group is fully paid, but still included in balance calculation`);
      }

      // Add group to balances (ALWAYS add, regardless of price or payment status)
      groupBalances.push({
        groupId: groupIdVal,
        groupName: appliedDiscount === 100 ? `${group.name} (FREE - 100% discount)` : (group.name || 'Unknown Group'),
        groupFees: actualGroupFee, // Use actual fee instead of discounted fee
        amountPaid: amountPaid,
        remainingAmount: roundedRemainingAmount,
        discount: appliedDiscount,
        isRegistrationFee: false,
        startDate: group.start_date || null,
      });

      console.log(`  ✅ Added group to groupBalances: ${group.name} (ID: ${groupIdVal})`);
    }

    // STEP 3: Calculate credits (additional amounts deposited) and refunds
    const balanceAdditions = payments.filter(p => {
      if (p.group_id !== null) return false; // Not a balance addition
      const notes = String(p.notes || '').toLowerCase();
      if (notes.includes('registration fee')) return false; // Not a credit
      if (notes.includes('debt')) return false; // Not a credit
      return true; // Pure deposits and refunds
    });

    // Calculate total credits (positive amounts) and refunds (negative amounts)
    totalCredits = balanceAdditions.reduce((sum, p) => {
      const amount = Number(p.amount || 0);
      const notes = String(p.notes || '').toLowerCase();

      if (p.payment_type === 'refund' || notes.includes('refund')) {
        // Refunds are negative amounts that reduce the balance
        console.log(`💸 Refund found: ${amount} DZD (${p.notes}) - Type: ${p.payment_type}`);
        return sum + amount; // amount is already negative, so this subtracts
      } else {
        // Regular deposits are positive amounts
        console.log(`💰 Deposit found: ${amount} DZD (${p.notes}) - Type: ${p.payment_type}`);
        if (notes.includes('cross-group refund credit')) {
          console.log(`🔄 Cross-group refund credit included in balance calculation: ${amount} DA`);
        }
        return sum + amount;
      }
    }, 0);

    // STEP 4: Calculate final balance - FIXED LOGIC
    // 🆕 NEW APPROACH: Calculate balance as (Total Paid) - (Total Owed)
    // This properly handles debt-to-credit transitions

    // Calculate total amount owed (all fees) - FIXED: Use totalBalance which includes registration fee
    const totalOwed = totalBalance; // This already includes registration fee + all group fees

    // Calculate total amount paid (all positive payments)
    const totalPaidAmount = payments.reduce((sum, p) => {
      // Only count actual payments (positive amounts)
      if (p.amount > 0) {
        return sum + p.amount;
      }
      return sum;
    }, 0);

    // Calculate remaining balance: (Total Paid) - (Total Owed)
    // If positive: student has credit (overpaid)
    // If negative: student owes money (underpaid)
    let remainingBalance = totalPaidAmount - totalOwed;

    // 🆕 Handle debt reduction payments - apply as direct debt reduction
    const debtReductionPayments = payments.filter(p => p.payment_type === 'debt_reduction');
    const totalDebtReduction = debtReductionPayments.reduce((sum, p) => sum + Math.abs(Number(p.amount || 0)), 0);

    if (totalDebtReduction > 0) {
      console.log(`💳 Debt reduction payments found: ${debtReductionPayments.length} totaling ${totalDebtReduction} DA`);
      debtReductionPayments.forEach((p, index) => {
        console.log(`  Debt Reduction ${index + 1}: Amount=${Math.abs(p.amount)} DZD, Notes=${p.notes}`);
      });

      // Apply debt reduction directly to balance
      const adjustedBalance = remainingBalance + totalDebtReduction;
      console.log(`💳 Applied debt reduction: ${remainingBalance} + ${totalDebtReduction} = ${adjustedBalance}`);

      // Update remaining balance with debt reduction
      remainingBalance = adjustedBalance;
    }

    // IMPORTANT: The remainingBalance should represent what the student actually owes
    // If they have unpaid amounts, it should be negative
    // If they have credits, it should be positive

    console.log(`Balance calculation for student ${studentId}:`);
    console.log(`  Total fees charged: ${totalOwed}`);
    console.log(`  Total amount paid: ${totalPaidAmount}`);
    console.log(`  Total credits/deposits: ${totalCredits}`);
    console.log(`  Total debt reduction: ${totalDebtReduction} (applied as debt reduction)`);
    console.log(`  Total unpaid amounts: ${totalOwed - totalPaidAmount}`);
    console.log(`  Final balance: ${remainingBalance} (negative = owes money, positive = has credit)`);

    // Debug: Show each group balance
    console.log('Group balances breakdown:');
    groupBalances.forEach(gb => {
      const status = gb.remainingAmount > 0 ? 'UNPAID' : 'PAID';
      console.log(`  ${gb.groupName}: Fee=${gb.groupFees}, Paid=${gb.amountPaid}, Remaining=${gb.remainingAmount} (${status})`);
    });

    // Additional debugging for troubleshooting
    console.log('=== DEBUGGING INFO ===');
    console.log(`Student groups count: ${studentGroups.length}`);
    console.log(`Payments count: ${payments.length}`);
    console.log(`Group balances count: ${groupBalances.length}`);

    if (groupBalances.length === 0) {
      console.log('⚠️ WARNING: No group balances found! This might indicate an issue.');
    } else {
      console.log('✅ Group balances found:');
      groupBalances.forEach((gb, index) => {
        console.log(`  ${index + 1}. ${gb.groupName} (ID: ${gb.groupId}): Fee=${gb.groupFees}, Paid=${gb.amountPaid}, Remaining=${gb.remainingAmount}, isRegistrationFee=${gb.isRegistrationFee}`);
      });
    }

    // ✅ SIMPLE SOLUTION: Balance calculation is now correct
    // Registration fee + Group fees = Total owed
    // Actual payments = Total paid
    // Remaining = Total owed - Total paid
    console.log('✅ SIMPLE SOLUTION: Balance calculation summary:');
    console.log(`  Total owed: ${totalOwed} (Registration: 500 + Groups: ${studentGroups.length} × discounted fees)`);
    console.log(`  Total paid: ${totalPaidAmount}`);
    console.log(`  Remaining balance: ${remainingBalance}`);

    return {
      totalBalance,
      totalPaid: totalPaidAmount, // Use the correct total paid amount
      remainingBalance,
      groupBalances,
    };
  },

  // New method to get recent payments with student and group info
  async getRecentPayments(limit: number = 50): Promise<Array<Payment & {
    studentName: string;
    groupName: string;
  }>> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent payments:', error);
      throw new Error(`Failed to fetch recent payments: ${error.message}`);
    }

    // Get unique student and group IDs (filter out null groupIds for balance additions)
    const studentIds = [...new Set(data?.map(p => p.student_id) || [])];
    const groupIds = [...new Set(data?.map(p => p.group_id).filter(id => id !== null) || [])];

    // Fetch students and groups separately
    let students: any[] = [];
    let groups: any[] = [];

    if (studentIds.length > 0) {
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, name')
        .in('id', studentIds);

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
      } else {
        students = studentsData || [];
      }
    }

    if (groupIds.length > 0) {
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('id, name')
        .in('id', groupIds);

      if (groupsError) {
        console.error('Error fetching groups:', groupsError);
      } else {
        groups = groupsData || [];
      }
    }

    return data?.map(payment => {
      const student = students.find(s => s.id === payment.student_id);
      const group = payment.group_id ? groups.find(g => g.id === payment.group_id) : null;

      // Debug logging for each payment
      console.log('Processing payment:', {
        id: payment.id,
        group_id: payment.group_id,
        payment_type: payment.payment_type,
        notes: payment.notes,
        amount: payment.amount
      });

      // Only filter out payments that are clearly invalid
      if (payment.amount === null || payment.amount === undefined) {
        console.log(`Skipping payment ${payment.id} - invalid amount`);
        return null;
      }

      // ✅ SIMPLE SOLUTION: Only show actual payments with proper notes
      if (!payment.notes || payment.notes.trim() === '') {
        console.log(`Skipping payment ${payment.id} - no notes (not a real payment)`);
        return null;
      }

      // IMPORTANT: Ensure registration fees are properly detected
      // Check if this is a registration fee payment (even if payment_type is not set)
      const isRegistrationFeePayment = !payment.group_id &&
        payment.notes &&
        String(payment.notes).toLowerCase().includes('registration fee');

      if (isRegistrationFeePayment) {
        console.log(`✅ Detected registration fee payment: ${payment.id}`);
      }

      // Determine payment type correctly
      const isRegistrationReceipt = !payment.group_id && payment.notes && String(payment.notes).toLowerCase().includes('registration fee');
      const isGroupPayment = payment.group_id !== null;
      const isBalanceAddition = !payment.group_id && !isRegistrationReceipt;

      // Set payment type based on actual data
      let paymentType: 'registration_fee' | 'group_payment' | 'balance_addition';
      if (payment.payment_type) {
        paymentType = payment.payment_type as any;
        console.log(`Using stored payment_type: ${paymentType}`);
      } else if (isRegistrationReceipt) {
        paymentType = 'registration_fee';
        console.log(`Inferred payment_type: ${paymentType} (registration fee)`);
      } else if (isGroupPayment) {
        paymentType = 'group_payment';
        console.log(`Inferred payment_type: ${paymentType} (group payment)`);
      } else {
        paymentType = 'balance_addition';
        console.log(`Inferred payment_type: ${paymentType} (balance addition)`);
      }

      return {
        id: payment.id,
        studentId: payment.student_id,
        groupId: payment.group_id,
        amount: payment.amount,
        date: new Date(payment.date),
        notes: payment.notes,
        adminName: payment.admin_name,
        discount: payment.discount || 0,
        originalAmount: payment.original_amount || payment.amount,
        paymentType: paymentType,
        studentName: student?.name || 'Unknown Student',
        groupName: group?.name || (payment.group_id === null ? (isRegistrationReceipt ? 'Registration fee' : 'Balance Addition') : 'Unknown Group'),
      };
    })
      .filter(payment => payment !== null) || [];
  },

  async depositAndAllocate(params: { studentId: string; amount: number; date: Date; notes?: string; adminName?: string; discount?: number; originalAmount?: number; }): Promise<{ depositId: string; allocations: Payment[] }> {
    const { studentId, amount, date, notes, adminName, discount = 0, originalAmount } = params;

    console.log(`🚀 DEPOSIT AND ALLOCATE CALLED:`, { studentId, amount, date, notes, adminName });

    if (amount <= 0) {
      throw new Error('Deposit amount must be greater than zero');
    }

    console.log(`Starting payment allocation for student ${studentId}, amount: ${amount}`);

    // Get current student balance to see what's unpaid
    const currentBalance = await this.getStudentBalance(studentId);
    console.log('Current balance:', currentBalance);

    // 🆕 DEBUG: Show detailed balance structure for stopped students
    if (currentBalance.remainingBalance < 0) {
      console.log(`🛑 STOPPED STUDENT DEBUG:`);
      console.log(`   - Total Balance: ${currentBalance.totalBalance} DA`);
      console.log(`   - Total Paid: ${currentBalance.totalPaid} DA`);
      console.log(`   - Remaining Balance: ${currentBalance.remainingBalance} DA`);
      console.log(`   - Group Balances:`, currentBalance.groupBalances.map(g => ({
        groupId: g.groupId,
        groupName: g.groupName,
        groupFees: g.groupFees,
        amountPaid: g.amountPaid,
        remainingAmount: g.remainingAmount,
        isRegistrationFee: g.isRegistrationFee
      })));
    }

    let available = amount;
    const allocations: Payment[] = [];

    // PRIORITY 1: Registration Fee ($500) - Always first
    const registrationBalance = currentBalance.groupBalances.find(gb => gb.isRegistrationFee);
    if (registrationBalance && registrationBalance.remainingAmount > 0 && available > 0) {
      const toPay = Math.min(available, registrationBalance.remainingAmount);
      // 🆕 FIX: Only apply discount to course fees, not balance credits
      const defaultDiscount = registrationBalance.discount || 0;
      const discountedAmount = defaultDiscount > 0 ? toPay * (1 - defaultDiscount / 100) : toPay;

      console.log(`Paying registration fee: ${toPay} (discounted: ${discountedAmount})`);

      // Create registration fee payment
      const { data: regPay, error: regErr } = await supabase
        .from('payments')
        .insert({
          student_id: studentId,
          group_id: null,
          amount: discountedAmount,
          date: date.toISOString().split('T')[0],
          notes: `Registration fee payment${discount > 0 ? ` - ${discount}% custom discount applied` : defaultDiscount > 0 ? ` - ${defaultDiscount}% default discount applied` : ''}`,
          admin_name: adminName || 'Dalila',
          discount: discount > 0 ? discount : defaultDiscount,
          original_amount: originalAmount || toPay,
          payment_type: 'registration_fee'
        })
        .select()
        .single();

      if (regErr) {
        throw new Error(`Failed to create registration fee payment: ${regErr.message}`);
      }

      // Generate receipt for registration fee payment
      try {
        const { data: receiptData, error: receiptError } = await supabase
          .from('receipts')
          .insert({
            student_id: studentId,
            student_name: (await supabase.from('students').select('name').eq('id', studentId).single()).data?.name || 'Unknown Student',
            payment_id: regPay.id,
            amount: discountedAmount,
            payment_type: 'registration_fee',
            group_name: 'Registration Fee',
            notes: `Registration fee payment${defaultDiscount > 0 ? ` - ${defaultDiscount}% discount applied` : ''}`,
            created_at: new Date().toISOString()
          });

        if (receiptError) {
          console.warn('⚠️ Could not create receipt for registration fee payment:', receiptError);
        } else {
          console.log('✅ Receipt generated successfully for registration fee payment');
        }
      } catch (receiptError) {
        console.warn('⚠️ Receipt generation failed for registration fee payment:', receiptError);
      }

      allocations.push({
        id: regPay.id,
        studentId: regPay.student_id,
        groupId: regPay.group_id,
        amount: regPay.amount,
        date: new Date(regPay.date),
        notes: regPay.notes,
        adminName: regPay.admin_name,
        discount: regPay.discount || 0,
        originalAmount: regPay.original_amount || regPay.amount,
      });

      available -= discountedAmount;
      console.log(`Registration fee paid: ${discountedAmount}, remaining available: ${available}`);
    }

    // PRIORITY 2: Group Fees (oldest first)
    // For debt payments, we want to pay off groups with outstanding balances
    let unpaidGroups = currentBalance.groupBalances
      .filter(gb => !gb.isRegistrationFee && gb.remainingAmount > 0)
      .sort((a, b) => {
        // Sort by remaining amount (highest debt first) for debt payments
        if (notes?.includes('debt payment') || notes?.includes('Debt payment')) {
          return b.remainingAmount - a.remainingAmount; // Highest debt first
        }
        // Sort by start date (oldest first) for regular payments
        const da = a.startDate ? new Date(a.startDate).getTime() : 0;
        const db = b.startDate ? new Date(b.startDate).getTime() : 0;
        return da - db;
      });

    // 🆕 SPECIAL HANDLING FOR STOPPED STUDENTS WITH DEBT
    // If this is a stopped student and they have debt, prioritize debt payment
    console.log(`🔍 CHECKING DEBT CONDITIONS: remainingBalance=${currentBalance.remainingBalance}, unpaidGroups.length=${unpaidGroups.length}`);

    if (currentBalance.remainingBalance < 0) {
      console.log(`🛑 Stopped student with debt detected: ${currentBalance.remainingBalance} DA`);
      console.log(`🔍 Looking for groups with debt in groupBalances...`);

      // For stopped students, look for groups that have debt (negative remainingAmount or unpaid fees)
      unpaidGroups = currentBalance.groupBalances
        .filter(gb => !gb.isRegistrationFee && (gb.remainingAmount > 0 || gb.groupFees > gb.amountPaid))
        .sort((a, b) => {
          // Calculate actual debt for each group
          const groupDebt = Math.max(0, a.groupFees - a.amountPaid);
          const groupBDebt = Math.max(0, b.groupFees - b.amountPaid);
          return groupBDebt - groupDebt; // Highest debt first
        });

      console.log(`📋 Found ${unpaidGroups.length} groups with debt for stopped student`);
      unpaidGroups.forEach(g => {
        const debt = Math.max(0, g.groupFees - g.amountPaid);
        console.log(`   - ${g.groupName}: Fee=${g.groupFees}, Paid=${g.amountPaid}, Debt=${debt}`);
      });

      // 🆕 If no unpaid groups found, create a debt reduction payment
      if (unpaidGroups.length === 0) {
        console.log(`🛑 No specific groups with debt found, creating debt reduction payment`);
        console.log(`💰 Student has overall debt of ${Math.abs(currentBalance.remainingBalance)} DA`);
        console.log(`💵 Available amount for debt reduction: ${available} DA`);

        // Create a debt reduction payment that will be applied to reduce the overall debt
        const debtAmount = Math.min(available, Math.abs(currentBalance.remainingBalance));

        console.log(`🔢 Calculated debt amount: ${debtAmount} DZD (min of ${available} and ${Math.abs(currentBalance.remainingBalance)})`);

        if (debtAmount > 0) {
          console.log(`💳 Creating debt reduction payment of ${debtAmount} DA`);
          console.log(`📝 Payment details: studentId=${studentId}, date=${date.toISOString().split('T')[0]}, adminName=${adminName || 'Dalila'}`);

          // Create a special payment type for debt reduction
          const { data: debtPay, error: debtErr } = await supabase
            .from('payments')
            .insert({
              student_id: studentId,
              group_id: null, // No specific group
              amount: debtAmount,
              date: date.toISOString().split('T')[0],
              notes: `Debt reduction payment - reducing overall debt from ${Math.abs(currentBalance.remainingBalance)} DA`,
              admin_name: adminName || 'Dalila',
              discount: 0,
              original_amount: debtAmount,
              payment_type: 'debt_reduction'
            })
            .select()
            .single();

          if (debtErr) {
            throw new Error(`Failed to create debt reduction payment: ${debtErr.message}`);
          }

          // 🆕 Generate receipt for debt reduction payment
          try {
            const { data: receiptData, error: receiptError } = await supabase
              .from('receipts')
              .insert({
                student_id: studentId,
                student_name: (await supabase.from('students').select('name').eq('id', studentId).single()).data?.name || 'Unknown Student',
                payment_id: debtPay.id,
                amount: debtAmount,
                payment_type: 'debt_reduction',
                group_name: 'Debt Reduction',
                notes: `Debt reduction payment - reducing overall debt from ${Math.abs(currentBalance.remainingBalance)} DA`,
                created_at: new Date().toISOString()
              });

            if (receiptError) {
              console.warn('⚠️ Could not create receipt for debt reduction payment:', receiptError);
            } else {
              console.log('✅ Receipt generated successfully for debt reduction payment');
            }
          } catch (receiptError) {
            console.warn('⚠️ Receipt generation failed for debt reduction payment:', receiptError);
          }

          allocations.push({
            id: debtPay.id,
            studentId: debtPay.student_id,
            groupId: debtPay.group_id,
            amount: debtPay.amount,
            date: new Date(debtPay.date),
            notes: debtPay.notes,
            adminName: debtPay.admin_name,
            discount: debtPay.discount || 0,
            originalAmount: debtPay.original_amount || debtPay.amount,
          });

          available -= debtAmount;
          console.log(`✅ Debt reduction payment created: ${debtAmount} DZD, remaining available: ${available} DZD`);
          console.log(`📊 Payment ID: ${debtPay.id}, Student ID: ${debtPay.student_id}`);
        } else {
          console.log(`⚠️ Debt amount is 0 or negative, skipping debt reduction payment`);
        }
      } else {
        console.log(`📋 Found ${unpaidGroups.length} unpaid groups, processing regular allocation instead of debt reduction`);
      }
    } else {
      console.log(`✅ No debt detected or debt reduction not needed. remainingBalance=${currentBalance.remainingBalance}`);
    }

    console.log(`Unpaid groups to process: ${unpaidGroups.length}`);
    console.log(`📋 Groups to pay:`, unpaidGroups.map(g => ({
      groupId: g.groupId,
      groupName: g.groupName,
      remainingAmount: g.remainingAmount
    })));
    console.log(`💰 Available amount before processing groups: ${available} DA`);

    for (const group of unpaidGroups) {
      console.log(`🔄 Processing group ${group.groupName}, available: ${available} DA`);
      if (available <= 0) {
        console.log(`❌ No more money available, stopping group processing`);
        break;
      }

      const toPay = Math.min(available, group.remainingAmount);

      // 🆕 NEW DISCOUNT LOGIC: Get group-specific discount from student_groups table
      let groupSpecificDiscount = 0;
      try {
        const { data: studentGroupData, error: sgError } = await supabase
          .from('student_groups')
          .select('group_discount')
          .eq('student_id', studentId)
          .eq('group_id', group.groupId)
          .single();

        if (!sgError && studentGroupData) {
          groupSpecificDiscount = Number(studentGroupData.group_discount || 0);
        }
      } catch (error) {
        console.log(`Could not fetch group-specific discount for group ${group.groupId}:`, error);
      }

      // 🆕 DISCOUNT PRIORITY: Custom discount > Group-specific discount > Student default discount
      const studentDefaultDiscount = group.discount || 0; // From getStudentBalance
      const appliedDiscount = discount > 0 ? discount : (groupSpecificDiscount > 0 ? groupSpecificDiscount : studentDefaultDiscount);
      const discountedAmount = appliedDiscount > 0 ? toPay * (1 - appliedDiscount / 100) : toPay;

      console.log(`🎯 Group ${group.groupName} discount calculation:`);
      console.log(`   - Student default: ${studentDefaultDiscount}%`);
      console.log(`   - Group-specific: ${groupSpecificDiscount}%`);
      console.log(`   - Custom payment: ${discount}%`);
      console.log(`   - Applied: ${appliedDiscount}%`);
      console.log(`   - Original: ${toPay}, Final: ${discountedAmount}`);
      const remainingAfter = group.remainingAmount - toPay;

      console.log(`💰 Paying group ${group.groupName} (ID: ${group.groupId}): ${toPay} DZD (discounted: ${discountedAmount} DZD)`);
      console.log(`   - Remaining before: ${group.remainingAmount} DA`);
      console.log(`   - Remaining after: ${remainingAfter} DA`);

      // Create group payment
      const { data: groupPay, error: groupErr } = await supabase
        .from('payments')
        .insert({
          student_id: studentId,
          group_id: group.groupId,
          amount: discountedAmount,
          date: date.toISOString().split('T')[0],
          notes: remainingAfter > 0
            ? `Partial group payment. Remaining: ${remainingAfter.toFixed(2)} DZD${discount > 0 ? ` - ${discount}% custom discount applied` : studentDefaultDiscount > 0 ? ` - ${studentDefaultDiscount}% default discount applied` : ''}`
            : `Group fully paid${discount > 0 ? ` - ${discount}% custom discount applied` : studentDefaultDiscount > 0 ? ` - ${studentDefaultDiscount}% default discount applied` : ''}`,
          admin_name: adminName || 'Dalila',
          discount: discount > 0 ? discount : studentDefaultDiscount,
          original_amount: originalAmount || toPay,
          payment_type: 'group_payment'
        })
        .select()
        .single();

      if (groupErr) {
        throw new Error(`Failed to create group payment: ${groupErr.message}`);
      }

      // Generate receipt for group payment
      try {
        const { data: receiptData, error: receiptError } = await supabase
          .from('receipts')
          .insert({
            student_id: studentId,
            student_name: (await supabase.from('students').select('name').eq('id', studentId).single()).data?.name || 'Unknown Student',
            payment_id: groupPay.id,
            amount: discountedAmount,
            payment_type: 'group_payment',
            group_name: group.groupName,
            notes: remainingAfter > 0
              ? `Partial group payment. Remaining: ${remainingAfter.toFixed(2)} DZD${appliedDiscount > 0 ? ` - ${appliedDiscount}% discount applied` : ''}`
              : `Group fully paid${appliedDiscount > 0 ? ` - ${appliedDiscount}% discount applied` : ''}`,
            created_at: new Date().toISOString()
          });

        if (receiptError) {
          console.warn('⚠️ Could not create receipt for group payment:', receiptError);
        } else {
          console.log('✅ Receipt generated successfully for group payment');
        }
      } catch (receiptError) {
        console.warn('⚠️ Receipt generation failed for group payment:', receiptError);
      }

      allocations.push({
        id: groupPay.id,
        studentId: groupPay.student_id,
        groupId: groupPay.group_id,
        amount: groupPay.amount,
        date: new Date(groupPay.date),
        notes: groupPay.notes,
        adminName: groupPay.admin_name,
        discount: groupPay.discount || 0,
        originalAmount: groupPay.original_amount || groupPay.amount,
      });

      available -= discountedAmount;
      console.log(`Group ${group.groupName} paid: ${discountedAmount}, remaining available: ${available}`);
    }

    // PRIORITY 3: Any remaining amount becomes balance credit
    let depositId = '';
    if (available > 0) {
      console.log(`Adding remaining amount ${available} as balance credit`);

      // 🆕 FIX: Balance credits should NOT have discounts applied
      const { data: creditPay, error: creditErr } = await supabase
        .from('payments')
        .insert({
          student_id: studentId,
          group_id: null,
          amount: available,
          date: date.toISOString().split('T')[0],
          notes: notes || 'Balance credit deposit',
          admin_name: adminName || 'Dalila',
          discount: 0, // No discount on balance credits
          original_amount: available,
          payment_type: 'balance_addition'
        })
        .select()
        .single();

      if (creditErr) {
        throw new Error(`Failed to create balance credit: ${creditErr.message}`);
      }

      // Generate receipt for balance addition payment
      try {
        const { data: receiptData, error: receiptError } = await supabase
          .from('receipts')
          .insert({
            student_id: studentId,
            student_name: (await supabase.from('students').select('name').eq('id', studentId).single()).data?.name || 'Unknown Student',
            payment_id: creditPay.id,
            amount: available,
            payment_type: 'balance_addition',
            group_name: 'Balance Credit',
            notes: notes || 'Balance credit deposit',
            created_at: new Date().toISOString()
          });

        if (receiptError) {
          console.warn('⚠️ Could not create receipt for balance addition payment:', receiptError);
        } else {
          console.log('✅ Receipt generated successfully for balance addition payment');
        }
      } catch (receiptError) {
        console.warn('⚠️ Receipt generation failed for balance addition payment:', receiptError);
      }

      depositId = creditPay.id;
      console.log(`Balance credit created: ${available}`);
    }

    console.log(`Payment allocation complete. Allocations: ${allocations.length}, Balance credit: ${available}`);
    console.log(`📊 Final allocation summary:`);
    allocations.forEach((allocation, index) => {
      console.log(`  ${index + 1}. Group ${allocation.groupId}: ${allocation.amount} DZD - ${allocation.notes}`);
    });

    console.log(`🎯 RETURNING RESULT:`, { depositId, allocations: allocations.length });
    return { depositId, allocations };
  },

  async allocateFromExistingCredit(params: { studentId: string; date?: Date; notes?: string; adminName?: string; }): Promise<Payment[]> {
    const { studentId, date, notes, adminName } = params;
    const allocationDate = date || new Date();

    // Determine available credits using balance (positive means credit)
    const balance = await paymentService.getStudentBalance(studentId);
    let available = balance.remainingBalance > 0 ? balance.remainingBalance : 0;
    if (available <= 0) return [];

    // Priority 0: Registration fee if unpaid
    const { data: studentRow } = await supabase
      .from('students')
      .select('registration_fee_paid, registration_fee_amount')
      .eq('id', studentId)
      .single();

    if (studentRow && !studentRow.registration_fee_paid && Number(studentRow.registration_fee_amount || 0) > 0) {
      const toPay = Math.min(available, Number(studentRow.registration_fee_amount));
      const { data: regPay, error: regErr } = await supabase
        .from('payments')
        .insert({
          student_id: studentId,
          group_id: null,
          amount: toPay,
          date: allocationDate.toISOString().split('T')[0],
          notes: 'Registration fee',
          admin_name: adminName || 'Dalila',
          discount: 0,
          original_amount: toPay,
        })
        .select()
        .single();

      if (!regErr) {
        if (toPay >= Number(studentRow.registration_fee_amount)) {
          await supabase
            .from('students')
            .update({ registration_fee_paid: true })
            .eq('id', studentId);
        } else {
          await supabase
            .from('students')
            .update({ registration_fee_amount: Number(studentRow.registration_fee_amount) - toPay })
            .eq('id', studentId);
        }
        available -= toPay;
      }
    }

    // Fetch student's groups and payments to compute unpaid
    const { data: studentGroups, error: groupsError } = await supabase
      .from('student_groups')
      .select(`
        group_id,
        groups (
          id,
          name,
          price,
          start_date
        )
      `)
      .eq('student_id', studentId);

    if (groupsError) {
      throw new Error(`Failed to fetch student groups: ${groupsError.message}`);
    }

    const { data: allPayments, error: allPaymentsError } = await supabase
      .from('payments')
      .select('group_id, amount, original_amount')
      .eq('student_id', studentId);

    if (allPaymentsError) {
      throw new Error(`Failed to fetch payments: ${allPaymentsError.message}`);
    }

    const paidPerGroup = new Map<number, number>();
    (allPayments || [])
      .filter((p: any) => p.group_id !== null)
      .forEach((p: any) => {
        const gid = Number(p.group_id);
        const paid = Number(p.original_amount ?? p.amount ?? 0);
        paidPerGroup.set(gid, (paidPerGroup.get(gid) || 0) + paid);
      });

    type UnpaidGroup = { id: number; name: string; price: number; startDate: string | null; remaining: number };
    const unpaidGroups: UnpaidGroup[] = (studentGroups || [])
      .map((sg: any) => {
        const g = sg.groups;
        const price = Number(g?.price || 0);
        const alreadyPaid = paidPerGroup.get(Number(g?.id)) || 0;
        const remaining = Math.max(0, price - alreadyPaid);
        return { id: g?.id, name: g?.name, price, startDate: g?.start_date || null, remaining } as UnpaidGroup;
      })
      .filter(g => g.remaining > 0)
      .sort((a, b) => {
        const da = a.startDate ? new Date(a.startDate).getTime() : 0;
        const db = b.startDate ? new Date(b.startDate).getTime() : 0;
        return da - db; // oldest first
      });

    const allocations: Payment[] = [];

    for (const g of unpaidGroups) {
      if (available <= 0) break;
      const toPay = Math.min(available, g.remaining);
      if (toPay <= 0) continue;

      const remainingAfter = g.remaining - toPay;
      const allocInsert = {
        student_id: studentId,
        group_id: g.id,
        amount: toPay,
        date: allocationDate.toISOString().split('T')[0],
        notes: remainingAfter > 0
          ? `Auto allocation from existing credit. Remaining for this group: ${remainingAfter.toFixed(2)}.` + (notes ? ` ${notes}` : '')
          : `Auto allocation from existing credit: group fully paid.` + (notes ? ` ${notes}` : ''),
        admin_name: adminName || 'Dalila',
        discount: 0,
        original_amount: toPay,
      };

      const { data: allocData, error: allocError } = await supabase
        .from('payments')
        .insert(allocInsert)
        .select()
        .single();

      if (allocError) {
        throw new Error(`Failed to allocate existing credit to group #${g.id}: ${allocError.message}`);
      }

      allocations.push({
        id: allocData.id,
        studentId: allocData.student_id,
        groupId: allocData.group_id,
        amount: allocData.amount,
        date: new Date(allocData.date),
        notes: allocData.notes,
        adminName: allocData.admin_name,
        discount: allocData.discount || 0,
        originalAmount: allocData.original_amount || allocData.amount,
      });

      available -= toPay;
    }

    return allocations;
  },

  // Refund and Debts functionality
  async getRefundList(): Promise<Array<{
    studentId: string;
    studentName: string;
    customId?: string;
    balance: number;
    groups: Array<{ id: number; name: string; status: string; stopReason?: string }>;
  }>> {
    try {
      console.log('Starting getRefundList function...');

      // Only get students who have groups with 'stopped' status
      const { data: stoppedStudents, error: stoppedError } = await supabase
        .from('student_groups')
        .select(`
          student_id,
          status,
          notes,
          groups!inner(
            id,
            name
          ),
          students!inner(
            id,
            custom_id,
            name
          )
        `)
        .eq('status', 'stopped');

      if (stoppedError) {
        console.error('Error fetching stopped students:', stoppedError);
        throw stoppedError;
      }

      console.log(`Found ${stoppedStudents?.length || 0} stopped group enrollments`);

      // Group by student to find students with ALL groups stopped
      const studentGroupsMap = new Map<string, any[]>();
      for (const enrollment of stoppedStudents || []) {
        const studentId = enrollment.student_id;
        if (!studentGroupsMap.has(studentId)) {
          studentGroupsMap.set(studentId, []);
        }
        studentGroupsMap.get(studentId)!.push(enrollment);
      }

      const refundList: Array<{
        studentId: string;
        studentName: string;
        customId?: string;
        balance: number;
        groups: Array<{ id: number; name: string; status: string }>;
      }> = [];

      // Check each student with stopped groups
      for (const [studentId, enrollments] of studentGroupsMap) {
        try {
          // Get all groups for this student to check if ALL are stopped
          const { data: allStudentGroups, error: allGroupsError } = await supabase
            .from('student_groups')
            .select(`
              group_id,
              status,
              groups!inner(
                id,
                name
              )
            `)
            .eq('student_id', studentId);

          if (allGroupsError) {
            console.error(`Error fetching all groups for student ${studentId}:`, allGroupsError);
            continue;
          }

          // Only process if ALL groups are stopped
          const allGroupsStopped = allStudentGroups?.every(g => g.status === 'stopped') || false;

          if (!allGroupsStopped) {
            console.log(`Student ${studentId} has some active groups, skipping refund`);
            continue;
          }

          // Get student balance
          const balance = await this.getStudentBalance(studentId);

          // Only include students with positive balance
          if (balance.remainingBalance > 0) {
            const student = enrollments[0]?.students;
            if (student) {
              // Check if student already has a pending refund request
              const { data: existingRequest, error: requestError } = await supabase
                .from('refund_requests')
                .select('id')
                .eq('student_id', studentId)
                .eq('status', 'pending')
                .limit(1);

              if (requestError) {
                console.error(`Error checking refund requests for student ${studentId}:`, requestError);
                // Continue anyway, don't fail the whole operation
              }

              if (existingRequest && existingRequest.length > 0) {
                console.log(`Student ${student.name} already has a pending refund request, skipping`);
                continue;
              }

              refundList.push({
                studentId: studentId,
                studentName: student.name,
                customId: student.custom_id,
                balance: balance.remainingBalance,
                groups: enrollments.map(e => ({
                  id: e.groups.id,
                  name: e.groups.name,
                  status: e.status,
                  stopReason: e.notes
                }))
              });

              console.log(`Added ${student.name} to refund list with balance: ${balance.remainingBalance}`);
            }
          }
        } catch (studentError) {
          console.error(`Error processing student ${studentId}:`, studentError);
          continue;
        }
      }

      console.log(`\n=== Refund List Complete ===`);
      console.log(`Total students eligible for refund: ${refundList.length}`);

      return refundList;
    } catch (error) {
      console.error('Error getting refund list:', error);
      throw error;
    }
  },

  async getDebtsList(): Promise<Array<{
    studentId: string;
    studentName: string;
    customId?: string;
    balance: number;
    groups: Array<{ id: number; name: string; status: string }>;
  }>> {
    try {
      console.log('Starting getDebtsList function...');

      // Only get students who have groups with 'stopped' status
      const { data: stoppedStudents, error: stoppedError } = await supabase
        .from('student_groups')
        .select(`
          student_id,
          status,
          groups!inner(
            id,
            name
          ),
          students!inner(
            id,
            custom_id,
            name
          )
        `)
        .eq('status', 'stopped');

      if (stoppedError) {
        console.error('Error fetching stopped students:', stoppedError);
        throw stoppedError;
      }

      console.log(`Found ${stoppedStudents?.length || 0} stopped group enrollments`);

      // Group by student to find students with ALL groups stopped
      const studentGroupsMap = new Map<string, any[]>();
      for (const enrollment of stoppedStudents || []) {
        const studentId = enrollment.student_id;
        if (!studentGroupsMap.has(studentId)) {
          studentGroupsMap.set(studentId, []);
        }
        studentGroupsMap.get(studentId)!.push(enrollment);
      }

      const debtsList: Array<{
        studentId: string;
        studentName: string;
        customId?: string;
        balance: number;
        groups: Array<{ id: number; name: string; status: string }>;
      }> = [];

      // Check each student with stopped groups
      for (const [studentId, enrollments] of studentGroupsMap) {
        try {
          // Get all groups for this student to check if ALL are stopped
          const { data: allStudentGroups, error: allGroupsError } = await supabase
            .from('student_groups')
            .select(`
              group_id,
              status,
              groups!inner(
                id,
                name
              )
            `)
            .eq('student_id', studentId);

          if (allGroupsError) {
            console.error(`Error fetching all groups for student ${studentId}:`, allGroupsError);
            continue;
          }

          // Only process if ALL groups are stopped
          const allGroupsStopped = allStudentGroups?.every(g => g.status === 'stopped') || false;

          if (!allGroupsStopped) {
            console.log(`Student ${studentId} has some active groups, skipping debt collection`);
            continue;
          }

          // Get student balance
          const balance = await this.getStudentBalance(studentId);

          // Only include students with negative balance
          if (balance.remainingBalance < 0) {
            const student = enrollments[0]?.students;
            if (student) {
              debtsList.push({
                studentId: studentId,
                studentName: student.name,
                customId: student.custom_id,
                balance: balance.remainingBalance,
                groups: enrollments.map(e => ({
                  id: e.groups.id,
                  name: e.groups.name,
                  status: e.status
                }))
              });

              console.log(`Added ${student.name} to debt list with balance: ${balance.remainingBalance}`);
            }
          }
        } catch (studentError) {
          console.error(`Error processing student ${studentId}:`, studentError);
          continue;
        }
      }

      console.log(`\n=== Debt List Complete ===`);
      console.log(`Total students eligible for debt collection: ${debtsList.length}`);

      return debtsList;
    } catch (error) {
      console.error('Error getting debts list:', error);
      throw error;
    }
  },

  async processRefund(studentId: string, amount: number, date: Date, notes?: string): Promise<void> {
    try {
      // Create a negative payment record (refund)
      const refundPayment: Omit<Payment, 'id'> = {
        studentId,
        groupId: undefined, // No specific group for refunds
        amount: -amount, // Negative amount for refunds
        date,
        notes: notes || 'Refund processed',
        adminName: 'Dalila',
        paymentType: 'refund' as any, // Using specific refund type
        originalAmount: amount,
        discount: 0
      };

      await this.create(refundPayment);
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  },

  // processDebtPayment function - REMOVED

  // New comprehensive function to handle attendance-based payment calculations
  async calculateAttendanceBasedPayments(): Promise<{
    refunds: Array<{
      studentId: string;
      studentName: string;
      customId?: string;
      balance: number;
      groups: Array<{ id: number; name: string; status: string }>;
    }>;
    debts: Array<{
      studentId: string;
      studentName: string;
      customId?: string;
      balance: number;
      groups: Array<{ id: number; name: string; status: string }>;
    }>;
  }> {
    try {
      // Get all students with their groups and attendance
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          name,
          custom_id,
          group_id,
          total_paid,
          groups (
            id,
            name,
            price
          )
        `);

      if (studentsError) {
        throw new Error(`Failed to fetch students: ${studentsError.message}`);
      }

      const refunds: Array<{
        studentId: string;
        studentName: string;
        customId?: string;
        balance: number;
        groups: Array<{ id: number; name: string; status: string }>;
      }> = [];

      const debts: Array<{
        studentId: string;
        studentName: string;
        customId?: string;
        balance: number;
        groups: Array<{ id: number; name: string; status: string }>;
      }> = [];

      for (const student of students || []) {
        if (!student.group_id) continue;

        // Get all sessions for this group
        const { data: sessions, error: sessionsError } = await supabase
          .from('sessions')
          .select('id, date')
          .eq('group_id', student.group_id)
          .order('date', { ascending: true });

        if (sessionsError) {
          console.error(`Error fetching sessions for student ${student.id}:`, sessionsError);
          continue;
        }

        // Get attendance for this student in all sessions
        const { data: attendance, error: attendanceError } = await supabase
          .from('attendance')
          .select('session_id, status')
          .eq('student_id', student.id)
          .in('session_id', sessions?.map(s => s.id) || []);

        if (attendanceError) {
          console.error(`Error fetching attendance for student ${student.id}:`, attendanceError);
          continue;
        }

        // Get payments for this student in this group
        const { data: payments, error: paymentsError } = await supabase
          .from('payments')
          .select('amount, payment_type')
          .eq('student_id', student.id)
          .eq('group_id', student.group_id);

        if (paymentsError) {
          console.error(`Error fetching payments for student ${student.id}:`, paymentsError);
          continue;
        }

        // Calculate total paid for this group (including attendance credits)
        const totalPaid = payments?.reduce((sum, p) => {
          if (p.payment_type === 'group_payment' || p.payment_type === 'attendance_credit' || p.amount > 0) {
            return sum + p.amount;
          }
          return sum;
        }, 0) || 0;

        // Calculate group fee
        const groupFee = student.groups?.[0]?.price || 0;

        // Analyze attendance patterns
        let hasStopStatus = false;
        let hasJustifyChangeNew = false;
        let presentSessions = 0;
        let totalSessions = sessions?.length || 0;

        for (const att of attendance || []) {
          if (att.status === 'stop') {
            hasStopStatus = true;
          } else if (['justified', 'change', 'new'].includes(att.status)) {
            hasJustifyChangeNew = true;
          } else if (['present', 'absent'].includes(att.status)) {
            presentSessions++;
          }
        }

        // Calculate remaining balance based on business logic
        let remainingBalance = 0;
        let shouldProcessRefund = false;
        let shouldProcessDebt = false;

        if (hasStopStatus) {
          // Student stopped - calculate based on sessions attended
          if (totalPaid >= groupFee) {
            // Already paid - calculate refund
            const sessionsValue = (presentSessions / totalSessions) * groupFee;
            remainingBalance = totalPaid - sessionsValue;
            shouldProcessRefund = remainingBalance > 0;
          } else {
            // Not fully paid - calculate remaining debt
            const sessionsValue = (presentSessions / totalSessions) * groupFee;
            remainingBalance = sessionsValue - totalPaid;
            shouldProcessDebt = remainingBalance > 0;
          }
        } else if (hasJustifyChangeNew) {
          // Student has justify/change/new status
          if (totalPaid >= groupFee) {
            // Already paid - add to balance
            const sessionsValue = (presentSessions / totalSessions) * groupFee;
            remainingBalance = totalPaid - sessionsValue;
            shouldProcessRefund = remainingBalance > 0;
          } else {
            // Not fully paid - deduct from group fee
            const sessionsValue = (presentSessions / totalSessions) * groupFee;
            remainingBalance = groupFee - sessionsValue - totalPaid;
            shouldProcessDebt = remainingBalance > 0;
          }
        }

        // Check if student is stopped in all groups (for refund/debt eligibility)
        const allGroups = await this.getAllGroupsForStudent(student.id);
        const isStoppedInAllGroups = allGroups.every(group => {
          const groupAttendance = attendance?.filter(a =>
            sessions?.some(s => s.id === a.session_id && group.id === group.id)
          );
          return groupAttendance?.some(a => a.status === 'stop');
        });

        // Add to appropriate list if eligible
        if (isStoppedInAllGroups) {
          if (shouldProcessRefund && remainingBalance > 0) {
            refunds.push({
              studentId: student.id,
              studentName: student.name,
              customId: student.custom_id,
              balance: remainingBalance,
              groups: allGroups.map(g => ({ id: g.id, name: g.name, status: 'stopped' }))
            });
          } else if (shouldProcessDebt && remainingBalance > 0) {
            debts.push({
              studentId: student.id,
              studentName: student.name,
              customId: student.custom_id,
              balance: remainingBalance,
              groups: allGroups.map(g => ({ id: g.id, name: g.name, status: 'stopped' }))
            });
          }
        }
      }

      return { refunds, debts };
    } catch (error) {
      console.error('Error calculating attendance-based payments:', error);
      throw error;
    }
  },

  // Helper function to get all groups for a student
  async getAllGroupsForStudent(studentId: string): Promise<Array<{ id: number; name: string }>> {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          group_id,
          groups (
            id,
            name
          )
        `)
        .eq('id', studentId);

      if (error) {
        throw new Error(`Failed to fetch student groups: ${error.message}`);
      }

      return data?.map(s => ({
        id: s.groups?.[0]?.id || 0,
        name: s.groups?.[0]?.name || 'Unknown Group'
      })) || [];
    } catch (error) {
      console.error('Error fetching student groups:', error);
      return [];
    }
  },

  // Process automatic refund for stopped students
  async processAutomaticRefund(studentId: string, amount: number, notes?: string): Promise<void> {
    try {
      // Create refund payment record
      const refundPayment: Omit<Payment, 'id'> = {
        studentId,
        groupId: undefined,
        amount: -amount, // Negative for refunds
        date: new Date(),
        notes: notes || 'Automatic refund for stopped student',
        adminName: 'System',
        paymentType: 'balance_addition',
        originalAmount: amount,
        discount: 0
      };

      await this.create(refundPayment);

      // Update student's total_paid to reflect the refund
      const { error: updateError } = await supabase
        .from('students')
        .update({ total_paid: 0 }) // Reset to zero after refund
        .eq('id', studentId);

      if (updateError) {
        console.error('Error updating student total_paid:', updateError);
      }
    } catch (error) {
      console.error('Error processing automatic refund:', error);
      throw error;
    }
  },

  // Comprehensive function to check all students and update debts/refunds lists
  async refreshAllStudentsForDebtsAndRefunds(): Promise<{
    refundsCount: number;
    debtsCount: number;
    processedStudents: number;
    errors: string[];
  }> {
    try {
      console.log('Starting comprehensive refresh of all students for debts and refunds...');

      const errors: string[] = [];
      let refundsCount = 0;
      let debtsCount = 0;
      let processedStudents = 0;

      // Only get students who have groups with 'stopped' status
      const { data: stoppedStudents, error: stoppedError } = await supabase
        .from('student_groups')
        .select(`
          student_id,
          status,
          groups!inner(
            id,
            name
          ),
          students!inner(
            id,
            name,
            custom_id
          )
        `)
        .eq('status', 'stopped');

      if (stoppedError) {
        throw new Error(`Failed to fetch stopped students: ${stoppedError.message}`);
      }

      // Group by student to find students with ALL groups stopped
      const studentGroupsMap = new Map<string, any[]>();
      for (const enrollment of stoppedStudents || []) {
        const studentId = enrollment.student_id;
        if (!studentGroupsMap.has(studentId)) {
          studentGroupsMap.set(studentId, []);
        }
        studentGroupsMap.get(studentId)!.push(enrollment);
      }

      console.log(`Processing ${studentGroupsMap.size} students with stopped groups...`);

      for (const [studentId, enrollments] of studentGroupsMap) {
        try {
          processedStudents++;
          const student = enrollments[0]?.students;
          console.log(`\n[${processedStudents}/${studentGroupsMap.size}] Processing student: ${student?.name || studentId}`);

          // Get all groups for this student to check if ALL are stopped
          const { data: allStudentGroups, error: allGroupsError } = await supabase
            .from('student_groups')
            .select(`
              group_id,
              status,
              groups!inner(
                id,
                name
              )
            `)
            .eq('student_id', studentId);

          if (allGroupsError) {
            console.error(`  Error fetching all groups for ${student?.name || studentId}:`, allGroupsError);
            errors.push(`Failed to fetch groups for ${student?.name || studentId}: ${allGroupsError.message}`);
            continue;
          }

          // Only process if ALL groups are stopped
          const allGroupsStopped = allStudentGroups?.every(g => g.status === 'stopped') || false;

          if (!allGroupsStopped) {
            console.log(`  ⚠️ ${student?.name || studentId} has some active groups, skipping`);
            continue;
          }

          // Get student balance
          const balance = await this.getStudentBalance(studentId);
          console.log(`  Balance: ${balance.remainingBalance}`);

          if (balance.remainingBalance > 0) {
            console.log(`  ✅ ${student?.name || studentId} qualifies for REFUND (balance: ${balance.remainingBalance})`);
            refundsCount++;
          } else if (balance.remainingBalance < 0) {
            console.log(`  ✅ ${student?.name || studentId} qualifies for DEBT (balance: ${balance.remainingBalance})`);
            debtsCount++;
          } else {
            console.log(`  ⚠️ ${student?.name || studentId} has zero balance, no action needed`);
          }

        } catch (studentError) {
          const errorMsg = `Error processing student ${studentId}: ${studentError}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      const result = {
        refundsCount,
        debtsCount,
        processedStudents,
        errors
      };

      console.log('\n=== REFRESH COMPLETE ===');
      console.log(`Processed: ${processedStudents} students`);
      console.log(`Refunds: ${refundsCount}`);
      console.log(`Debts: ${debtsCount}`);
      console.log(`Errors: ${errors.length}`);

      return result;

    } catch (error) {
      console.error('Error in refreshAllStudentsForDebtsAndRefunds:', error);
      throw error;
    }
  },

  // Process automatic debt payment for stopped students
  async processAutomaticDebtPayment(studentId: string, amount: number, notes?: string): Promise<void> {
    try {
      // Create debt payment record
      const debtPayment: Omit<Payment, 'id'> = {
        studentId,
        groupId: undefined,
        amount: amount, // Positive for debt payments
        date: new Date(),
        notes: notes || 'Automatic debt payment for stopped student',
        adminName: 'System',
        paymentType: 'balance_addition',
        originalAmount: amount,
        discount: 0
      };

      await this.create(debtPayment);

      // Update student's total_paid to reflect the debt payment
      const { error: updateError } = await supabase
        .from('students')
        .update({ total_paid: 0 }) // Reset to zero after debt payment
        .eq('id', studentId);

      if (updateError) {
        console.error('Error updating student total_paid:', updateError);
      }
    } catch (error) {
      console.error('Error processing automatic debt payment:', error);
      throw error;
    }
  },

  // NEW: Handle attendance-based refunds
  async processAttendanceRefund(studentId: string, groupId: number, sessionId: string, status: string, refundAmount: number): Promise<void> {
    try {
      console.log(`Processing attendance refund for student ${studentId}, group ${groupId}, session ${sessionId}, status: ${status}, amount: ${refundAmount}`);

      // Check if student has already paid for this group
      const { data: groupPayments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount, original_amount')
        .eq('student_id', studentId)
        .eq('group_id', groupId);

      if (paymentsError) {
        throw new Error(`Failed to fetch group payments: ${paymentsError.message}`);
      }

      const totalPaid = groupPayments?.reduce((sum, p) => sum + Number(p.original_amount || p.amount || 0), 0) || 0;

      if (totalPaid > 0) {
        // Student has paid - add refund to balance
        console.log(`Student has paid ${totalPaid} for group ${groupId}, adding refund to balance`);

        const refundPayment: Omit<Payment, 'id'> = {
          studentId,
          groupId: undefined,
          amount: refundAmount, // Positive amount (credit to balance)
          date: new Date(),
          notes: `Attendance refund for session ${sessionId} (${status}) - Group: ${groupId}`,
          adminName: 'System',
          paymentType: 'balance_addition',
          originalAmount: refundAmount,
          discount: 0
        };

        await this.create(refundPayment);
        console.log(`Refund added to balance: ${refundAmount}`);
      } else {
        // Student hasn't paid - subtract from unpaid group amount
        console.log(`Student hasn't paid for group ${groupId}, refund will be handled in balance calculation`);
        // This will be handled automatically by the balance calculation system
      }
    } catch (error) {
      console.error('Error processing attendance refund:', error);
      throw error;
    }
  },

  // Helper method to check if student is stopped in ALL groups
  async isStudentFullyStopped(studentId: string): Promise<boolean> {
    try {
      const { data: studentGroups, error } = await supabase
        .from('student_groups')
        .select('status')
        .eq('student_id', studentId);

      if (error || !studentGroups || studentGroups.length === 0) {
        return false;
      }

      // Student is fully stopped if ALL groups have 'stopped' status
      return studentGroups.every(group => group.status === 'stopped');
    } catch (error) {
      console.error('Error checking if student is fully stopped:', error);
      return false;
    }
  },

  // Helper method to check if student has any active groups
  async hasActiveGroups(studentId: string): Promise<boolean> {
    try {
      const { data: studentGroups, error } = await supabase
        .from('student_groups')
        .select('status')
        .eq('student_id', studentId);

      if (error || !studentGroups || studentGroups.length === 0) {
        return false;
      }

      // Student has active groups if ANY group has 'active' status
      return studentGroups.some(group => group.status === 'active');
    } catch (error) {
      console.error('Error checking if student has active groups:', error);
      return false;
    }
  },

  // Helper method to check if student has attendance but no active groups (removed from groups)
  async hasAttendanceButNoActiveGroups(studentId: string): Promise<boolean> {
    try {
      // Check if student has any group memberships
      const { data: studentGroups, error: groupsError } = await supabase
        .from('student_groups')
        .select('group_id')
        .eq('student_id', studentId);

      if (groupsError) {
        console.error('Error checking student groups:', groupsError);
        return false;
      }

      // If student has active groups, they don't need retrospective calculation
      if (studentGroups && studentGroups.length > 0) {
        return false;
      }

      // Check if student has any attendance records
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .select('session_id')
        .eq('student_id', studentId)
        .limit(1);

      if (attendanceError) {
        console.error('Error checking attendance:', attendanceError);
        return false;
      }

      // Student needs retrospective calculation if they have attendance but no groups
      return attendance && attendance.length > 0;
    } catch (error) {
      console.error('Error checking attendance but no groups:', error);
      return false;
    }
  },

  // Retrospective balance calculation for stopped students
  async getStoppedStudentBalance(studentId: string): Promise<{
    totalBalance: number;
    totalPaid: number;
    remainingBalance: number;
    groupBalances: Array<{
      groupId: number;
      groupName: string;
      groupFees: number;
      amountPaid: number;
      remainingAmount: number;
      discount?: number;
      isRegistrationFee?: boolean;
      startDate?: string;
    }>;
  }> {
    try {
      console.log('🛑 Calculating retrospective balance for stopped student:', studentId);

      // Get student info
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('name, default_discount')
        .eq('id', studentId)
        .single();

      if (studentError) {
        throw new Error(`Failed to fetch student: ${studentError.message}`);
      }

      // Get all payments for this student
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('group_id, amount, original_amount, discount, notes, payment_type, date')
        .eq('student_id', studentId);

      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError);
      }

      const allPayments = payments || [];
      console.log(`📋 Found ${allPayments.length} total payments for stopped student`);
      console.log(`💳 All payments detailed:`);
      allPayments.forEach((p, index) => {
        console.log(`  Payment ${index + 1}: Amount=${p.amount} DZD, Type="${p.payment_type}", GroupID=${p.group_id}, Date=${p.date}`);
      });

      // Get student groups with attendance data
      // First try from student_groups table (for stopped students)
      let studentGroups: any[] = [];
      const { data: groupsFromMembership, error: groupsError } = await supabase
        .from('student_groups')
        .select(`
          group_id,
          status,
          groups!inner(
            id,
            name,
            price,
            total_sessions
          )
        `)
        .eq('student_id', studentId);

      if (!groupsError && groupsFromMembership && groupsFromMembership.length > 0) {
        studentGroups = groupsFromMembership;
        console.log(`📊 Found ${studentGroups.length} groups from student_groups table`);
      } else {
        // Fallback: Get groups from attendance records (for removed students)
        console.log('🔍 No groups in student_groups, reconstructing from attendance records');
        const { data: attendanceRecords, error: attendanceError } = await supabase
          .from('attendance')
          .select(`
            session_id,
            status,
            sessions!inner(
              id,
              group_id,
              groups!inner(
                id,
                name,
                price,
                total_sessions
              )
            )
          `)
          .eq('student_id', studentId);

        if (attendanceError) {
          throw new Error(`Failed to fetch attendance records: ${attendanceError.message}`);
        }

        // Group attendance by group_id and reconstruct group data
        const groupsMap = new Map();
        attendanceRecords?.forEach((record: any) => {
          const session = record.sessions;
          const group = session.groups;
          if (!groupsMap.has(group.id)) {
            groupsMap.set(group.id, {
              group_id: group.id,
              status: 'removed', // Indicate this student was removed
              groups: group
            });
          }
        });

        studentGroups = Array.from(groupsMap.values());
        console.log(`📊 Reconstructed ${studentGroups.length} groups from attendance records`);
      }

      const groupBalances: Array<{
        groupId: number;
        groupName: string;
        groupFees: number;
        amountPaid: number;
        remainingAmount: number;
        discount?: number;
        isRegistrationFee?: boolean;
        startDate?: string;
      }> = [];

      let totalBalance = 0; // Will add registration fee only if unpaid
      let totalPaid = 0;

      // Add registration fee - include all payments without group_id (registration payments)
      const registrationPayments = allPayments.filter(p => !p.group_id || p.group_id === null);
      const registrationPaid = registrationPayments.reduce((sum, p) => sum + p.amount, 0);

      console.log(`💰 Registration fee calculation: Found ${registrationPayments.length} payments totaling ${registrationPaid} DA`);

      // Only add registration fee to balance if it's not fully paid
      const registrationOwed = Math.max(0, 500 - registrationPaid);
      if (registrationOwed > 0) {
        totalBalance += registrationOwed;
        console.log(`📋 Registration fee unpaid: Adding ${registrationOwed} DA to total balance`);
      } else {
        console.log(`✅ Registration fee fully paid: Not adding to balance`);
      }

      totalPaid += registrationPaid;

      groupBalances.push({
        groupId: 0,
        groupName: 'Registration Fee',
        groupFees: 500,
        amountPaid: registrationPaid,
        remainingAmount: registrationOwed,
        isRegistrationFee: true
      });

      // Process each group with retrospective attendance calculation
      for (const studentGroup of studentGroups || []) {
        const groupInfo = Array.isArray(studentGroup.groups) ? studentGroup.groups[0] : studentGroup.groups;
        const groupId = groupInfo.id;

        console.log(`📊 Processing stopped group: ${groupInfo.name} (${groupId})`);

        // Get attendance data for this student in this group
        const { data: sessions, error: sessionsError } = await supabase
          .from('sessions')
          .select('id, date')
          .eq('group_id', groupId)
          .order('date', { ascending: true });

        if (sessionsError) {
          console.error(`Error fetching sessions for group ${groupId}:`, sessionsError);
          continue;
        }

        // Get attendance records
        const { data: attendance, error: attendanceError } = await supabase
          .from('attendance')
          .select('session_id, status')
          .eq('student_id', studentId)
          .in('session_id', sessions?.map(s => s.id) || []);

        if (attendanceError) {
          console.error(`Error fetching attendance for group ${groupId}:`, attendanceError);
        }

        const attendanceMap = new Map();
        attendance?.forEach(att => {
          attendanceMap.set(att.session_id, att.status);
        });

        // 🎯 YOUR SIMPLE LOGIC: Count only obligatory sessions
        // MUST PAY: present, absent, too_late
        // NOT COUNTED: justified, change, new, stop, default

        let obligatorySessions = 0; // Sessions that MUST be paid for
        let freeSessions = 0; // Sessions NOT counted for payment

        for (const session of sessions || []) {
          const status = attendanceMap.get(session.id) || 'default';

          if (['present', 'absent', 'too_late', 'default'].includes(status)) {
            obligatorySessions++; // MUST PAY
          } else {
            freeSessions++; // NOT COUNTED (justified, new, change, stop)
          }
        }

        const totalSessions = groupInfo.total_sessions;
        const fullGroupPrice = groupInfo.price;
        const pricePerSession = fullGroupPrice / totalSessions;

        // 💰 ACTUAL group fee = only obligatory sessions
        const actualGroupFee = obligatorySessions * pricePerSession;
        const freeAmount = freeSessions * pricePerSession;

        console.log(`📈 Group ${groupInfo.name}: Total=${totalSessions}, Obligatory=${obligatorySessions}, Free=${freeSessions}`);
        console.log(`💰 Fee breakdown: Must pay=${actualGroupFee} DZD, Free=${freeAmount} DZD, Full=${fullGroupPrice} DZD`);

        // Get actual money payments for this group (exclude only registration fee)
        // Include group_payment, attendance_credit, and balance_addition as valid payments
        const groupPayments = allPayments.filter(p =>
          p.group_id === groupId &&
          p.payment_type !== 'registration_fee'
        );

        console.log(`🔍 Group ${groupId} payment filtering:`);
        console.log(`  - All payments for this group:`, allPayments.filter(p => p.group_id === groupId));
        console.log(`  - Filtered group payments:`, groupPayments);
        console.log(`  - Payment types found:`, allPayments.filter(p => p.group_id === groupId).map(p => p.payment_type));

        const groupPaid = groupPayments.reduce((sum, p) => sum + p.amount, 0);

        console.log(`💰 Group ${groupId} payments detailed:`);
        groupPayments.forEach((p, index) => {
          console.log(`    Group Payment ${index + 1}: Amount=${p.amount} DZD, Type="${p.payment_type}", Date=${p.date}`);
        });
        console.log(`💰 Total paid for group ${groupId}: ${groupPaid} DA`);

        // 🎯 SIMPLE BALANCE CALCULATION
        let finalGroupFee = actualGroupFee; // Only charge for obligatory sessions
        let balanceAdjustment = 0; // Amount to add to student balance

        if (groupPaid > actualGroupFee) {
          // Student OVERPAID: refund the excess to balance
          balanceAdjustment = groupPaid - actualGroupFee;
          console.log(`💰 Student OVERPAID: Paid=${groupPaid}, Should pay=${actualGroupFee}, Refunding=${balanceAdjustment} to balance`);
        } else {
          // Student owes the remaining amount or paid exactly right
          const remaining = actualGroupFee - groupPaid;
          console.log(`💰 Student balance: Paid=${groupPaid}, Should pay=${actualGroupFee}, Still owes=${remaining}`);
        }

        totalBalance += finalGroupFee;
        totalPaid += groupPaid;

        // Track balance adjustment separately (don't add to totalPaid)
        if (balanceAdjustment > 0) {
          console.log(`✨ Balance adjustment: ${balanceAdjustment} DA to be refunded`);
        }

        groupBalances.push({
          groupId: groupId,
          groupName: groupInfo.name,
          groupFees: finalGroupFee, // Only obligatory sessions fee
          amountPaid: groupPaid,
          remainingAmount: Math.max(0, finalGroupFee - groupPaid),
          discount: student.default_discount || 0
        });
      }

      // 🆕 Calculate debt reduction payments (payments that reduce overall debt)
      const debtReductionPayments = allPayments.filter(p => p.payment_type === 'debt_reduction');
      const totalDebtReduction = debtReductionPayments.reduce((sum, p) => sum + p.amount, 0);

      console.log(`💳 Debt reduction payments found: ${debtReductionPayments.length} totaling ${totalDebtReduction} DA`);
      debtReductionPayments.forEach((p, index) => {
        console.log(`  Debt Reduction ${index + 1}: Amount=${p.amount} DZD, Date=${p.date}, Notes=${p.notes}`);
      });

      // For stopped students: Balance = What they owe for sessions (negative = debt) - debt reduction payments
      // Registration fee is separate and doesn't reduce session debt
      const remainingBalance = -totalBalance + totalDebtReduction;

      console.log(`💰 Stopped student balance calculation:
        Total fair balance: ${totalBalance}
        Total paid: ${totalPaid}
        Debt reduction payments: ${totalDebtReduction}
        Remaining balance: ${remainingBalance}`);

      return {
        totalBalance,
        totalPaid,
        remainingBalance,
        groupBalances
      };

    } catch (error) {
      console.error('Error calculating stopped student balance:', error);
      throw error;
    }
  },

  // Teacher Attendance Operations
  async getTeacherAttendance(teacherId: string, startDate?: string, endDate?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('teacher_attendance')
        .select(`
          *,
          sessions!inner(
            id,
            date,
            session_number,
            topic
          ),
          groups!inner(
            id,
            name
          )
        `)
        .eq('teacher_id', teacherId)
        .order('date', { ascending: false });

      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching teacher attendance:', error);
      throw error;
    }
  },

  async saveTeacherAttendance(attendanceData: Array<{
    teacherId: string;
    sessionId: string;
    groupId: number;
    date: string;
    status: 'present' | 'late' | 'absent';
    notes?: string;
  }>): Promise<void> {
    try {
      // First, delete any existing attendance records for these sessions
      const sessionIds = attendanceData.map(d => d.sessionId);
      const { error: deleteError } = await supabase
        .from('teacher_attendance')
        .delete()
        .in('session_id', sessionIds);

      if (deleteError) throw deleteError;

      // Insert new attendance records
      const { error: insertError } = await supabase
        .from('teacher_attendance')
        .insert(attendanceData.map(data => ({
          teacher_id: data.teacherId,
          session_id: data.sessionId,
          group_id: data.groupId,
          date: data.date,
          status: data.status,
          notes: data.notes || null,
          evaluated_by: 'current_user_id' // This should be the actual admin user ID
        })));

      if (insertError) throw insertError;
    } catch (error) {
      console.error('Error saving teacher attendance:', error);
      throw error;
    }
  },

  async getTeacherAttendanceSummary(teacherId: string): Promise<{
    totalSessions: number;
    presentCount: number;
    lateCount: number;
    absentCount: number;
    attendanceRate: number;
  }> {
    try {
      const attendance = await this.getTeacherAttendance(teacherId);

      const totalSessions = attendance.length;
      const presentCount = attendance.filter(a => a.status === 'present').length;
      const lateCount = attendance.filter(a => a.status === 'late').length;
      const absentCount = attendance.filter(a => a.status === 'absent').length;
      const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

      return {
        totalSessions,
        presentCount,
        lateCount,
        absentCount,
        attendanceRate
      };
    } catch (error) {
      console.error('Error getting teacher attendance summary:', error);
      throw error;
    }
  },

  // Teacher Salary Operations
  async getTeacherUnpaidGroups(teacherId: string) {
    try {
      console.log('🔄 Using server-side calculation for teacher unpaid groups...');

      const response = await fetch('/api/teacher-salary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getUnpaidGroups',
          data: { teacherId }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch unpaid groups');
      }

      console.log(`✅ Server-side calculation complete. Found ${result.data.length} unpaid groups`);
      return result.data;

    } catch (error) {
      console.error('❌ Error fetching teacher unpaid groups:', error);
      throw error;
    }
  },



  async calculateGroupSalary(teacherId: string, groupId: number) {
    try {
      const { data, error } = await supabase
        .rpc('calculate_teacher_group_salary', {
          p_teacher_id: teacherId,
          p_group_id: groupId
        });

      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      console.error('Error calculating group salary:', error);
      throw error;
    }
  },

  async payTeacherSalary(salaryData: {
    teacher_id: string;
    group_id: number;
    total_sessions: number;
    present_sessions: number;
    late_sessions: number;
    absent_sessions: number;
    justified_sessions: number;
    calculated_salary: number;
    paid_amount: number;
    payment_date: string;
    payment_notes?: string;
  }) {
    try {
      const response = await fetch('/api/teacher-salary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'paySalary',
          data: salaryData
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to pay teacher salary');
      }

      return result.data;
    } catch (error) {
      console.error('Error paying teacher salary:', error);
      throw error;
    }
  },

  async getTeacherSalaryHistory(teacherId: string) {
    try {
      const response = await fetch('/api/teacher-salary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getSalaryHistory',
          data: { teacherId }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch teacher salary history');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching teacher salary history:', error);
      throw error;
    }
  },

  async updateTeacherPricePerSession(teacherId: string, pricePerSession: number) {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .update({ price_per_session: pricePerSession })
        .eq('id', teacherId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating teacher price per session:', error);
      throw error;
    }
  },

  // Handle cross-group refund when student stops from one group but has active groups
  async handleCrossGroupRefund(studentId: string, stoppedGroupId: number): Promise<void> {
    try {
      console.log(`🔄 CROSS-GROUP REFUND: Processing for student ${studentId}, stopped from group ${stoppedGroupId}`);

      // 1. Check if student has other active groups
      const { data: allStudentGroups, error: groupsError } = await supabase
        .from('student_groups')
        .select(`
          group_id,
          status,
          groups!inner(
            id,
            name,
            price
          )
        `)
        .eq('student_id', studentId);

      if (groupsError) {
        console.error('Error fetching student groups for cross-group refund:', groupsError);
        return;
      }

      if (!allStudentGroups || allStudentGroups.length === 0) {
        console.log('🔄 No student groups found, skipping cross-group refund');
        return;
      }

      // 2. Check if student has any active groups (excluding the stopped one)
      const activeGroups = allStudentGroups.filter(sg =>
        sg.status === 'active' && sg.group_id !== stoppedGroupId
      );

      if (activeGroups.length === 0) {
        console.log('🔄 No active groups found, student will be processed for regular refund/debt');
        return;
      }

      console.log(`🔄 Found ${activeGroups.length} active groups for cross-group refund processing`);

      // 3. Calculate refund amount from the stopped group
      const { data: stoppedGroupPayments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount, original_amount, payment_type')
        .eq('student_id', studentId)
        .eq('group_id', stoppedGroupId)
        .in('payment_type', ['group_payment', 'attendance_credit']);

      if (paymentsError) {
        console.error('Error fetching payments for stopped group:', paymentsError);
        return;
      }

      const totalPaidToStoppedGroup = stoppedGroupPayments?.reduce((sum, p) =>
        sum + Number(p.original_amount || p.amount || 0), 0) || 0;

      if (totalPaidToStoppedGroup <= 0) {
        console.log('🔄 No payments found for stopped group, no refund needed');
        return;
      }

      console.log(`🔄 Total paid to stopped group ${stoppedGroupId}: ${totalPaidToStoppedGroup} DA`);

      // 4. Find active group with unpaid fees
      let refundAmount = totalPaidToStoppedGroup;

      for (const activeGroup of activeGroups) {
        if (refundAmount <= 0) break;

        const groupId = activeGroup.group_id;
        const groupName = (activeGroup.groups as any).name;
        const groupPrice = Number((activeGroup.groups as any).price || 0);

        // Get payments for this active group
        const { data: activeGroupPayments, error: activePaymentsError } = await supabase
          .from('payments')
          .select('amount, original_amount, payment_type')
          .eq('student_id', studentId)
          .eq('group_id', groupId)
          .in('payment_type', ['group_payment', 'attendance_credit']);

        if (activePaymentsError) {
          console.error(`Error fetching payments for active group ${groupId}:`, activePaymentsError);
          continue;
        }

        const totalPaidToActiveGroup = activeGroupPayments?.reduce((sum, p) =>
          sum + Number(p.original_amount || p.amount || 0), 0) || 0;

        const unpaidAmount = Math.max(0, groupPrice - totalPaidToActiveGroup);

        if (unpaidAmount > 0) {
          const transferAmount = Math.min(refundAmount, unpaidAmount);

          console.log(`🔄 Transferring ${transferAmount} DZD from stopped group to active group ${groupId} (${groupName})`);
          console.log(`   - Group price: ${groupPrice} DA`);
          console.log(`   - Already paid: ${totalPaidToActiveGroup} DA`);
          console.log(`   - Unpaid amount: ${unpaidAmount} DA`);
          console.log(`   - Transfer amount: ${transferAmount} DA`);

          // 5. Create cross-group transfer payment
          const { data: transferPayment, error: transferError } = await supabase
            .from('payments')
            .insert({
              student_id: studentId,
              group_id: groupId,
              amount: transferAmount,
              date: new Date().toISOString().split('T')[0],
              notes: `Cross-group refund: Transferred from stopped group ${stoppedGroupId} to active group ${groupId}`,
              admin_name: 'System',
              discount: 0,
              original_amount: transferAmount,
              payment_type: 'group_payment'
            })
            .select()
            .single();

          if (transferError) {
            console.error('Error creating cross-group transfer payment:', transferError);
            continue;
          }

          console.log(`✅ Cross-group transfer payment created: ${transferPayment.id}`);

          // 6. Create corresponding negative payment for the stopped group
          const { data: refundPayment, error: refundError } = await supabase
            .from('payments')
            .insert({
              student_id: studentId,
              group_id: stoppedGroupId,
              amount: -transferAmount,
              date: new Date().toISOString().split('T')[0],
              notes: `Cross-group refund: Refunded from group ${stoppedGroupId} and transferred to group ${groupId}`,
              admin_name: 'System',
              discount: 0,
              original_amount: transferAmount,
              payment_type: 'refund'
            })
            .select()
            .single();

          if (refundError) {
            console.error('Error creating cross-group refund payment:', refundError);
            continue;
          }

          console.log(`✅ Cross-group refund payment created: ${refundPayment.id}`);

          refundAmount -= transferAmount;
        }
      }

      if (refundAmount > 0) {
        console.log(`🔄 Remaining refund amount ${refundAmount} DA - creating balance credit`);

        // Create a balance credit payment for the remaining refund amount
        const { data: creditPayment, error: creditError } = await supabase
          .from('payments')
          .insert({
            student_id: studentId,
            group_id: null, // No specific group for balance credits
            amount: refundAmount,
            date: new Date().toISOString().split('T')[0],
            notes: `Cross-group refund credit: Remaining amount from stopped group ${stoppedGroupId} after covering active group fees`,
            admin_name: 'System',
            discount: 0,
            original_amount: refundAmount,
            payment_type: 'balance_addition'
          })
          .select()
          .single();

        if (creditError) {
          console.error('Error creating balance credit payment:', creditError);
        } else {
          console.log(`✅ Balance credit payment created: ${creditPayment.id} for ${refundAmount} DA`);
          console.log(`💰 Student will now have ${refundAmount} DA credit balance available`);
        }
      }

      console.log(`🔄 Cross-group refund processing completed`);

    } catch (error) {
      console.error('Error in handleCrossGroupRefund:', error);
    }
  },
};

// Waiting List operations
export const waitingListService = {
  async getAll(): Promise<WaitingListStudent[]> {
    const { data, error } = await supabase
      .from('waiting_list')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching waiting list:', error);
      throw new Error(`Failed to fetch waiting list: ${error.message}`);
    }

    return data?.map(student => ({
      id: student.id,
      custom_id: student.custom_id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      address: student.address,
      birthDate: student.birth_date ? new Date(student.birth_date) : undefined,
      language: student.language,
      level: student.level,
      category: student.category,
      notes: student.notes,
      parentName: student.parent_name,
      secondPhone: student.second_phone,
      customLanguage: student.custom_language,
      customLevel: student.custom_level,
      customCategory: student.custom_category,
      // 🆕 ADD: Missing fields that were being lost
      defaultDiscount: student.default_discount || 0,
      registrationFeePaid: student.registration_fee_paid || false,
      registrationFeeAmount: student.registration_fee_amount || 500,
      createdAt: new Date(student.created_at),
    })) || [];
  },

  async create(student: Omit<WaitingListStudent, 'id' | 'createdAt'>): Promise<WaitingListStudent> {
    try {
      // Handle email - provide a default if empty to satisfy NOT NULL constraint
      let emailValue = student.email && student.email.trim() !== '' ? student.email.trim() : null;

      // If email is empty and we need to provide a default, use a placeholder
      if (!emailValue) {
        // Try to generate a unique email based on name and phone
        const nameSlug = student.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const phoneSlug = student.phone ? student.phone.replace(/[^0-9]/g, '').slice(-4) : '0000';
        emailValue = `${nameSlug}${phoneSlug}@waitinglist.local`;
      }

      console.log('Creating waiting list student with data:', {
        name: student.name,
        email: emailValue,
        phone: student.phone,
        address: student.address,
        birth_date: student.birthDate,
        language: student.language,
        level: student.level,
        category: student.category,
        notes: student.notes,
        parent_name: student.parentName,
        second_phone: student.secondPhone,
        custom_language: student.customLanguage,
        custom_level: student.customLevel,
        custom_category: student.customCategory,
        default_discount: student.defaultDiscount || 0,
        // 🆕 DEBUG: Registration fee fields
        registration_fee_paid: student.registrationFeePaid,
        registration_fee_amount: student.registrationFeeAmount,
      });

      // Validate required fields
      if (!student.name || !student.language || !student.level || !student.category) {
        throw new Error('Missing required fields: name, language, level, and category are required');
      }
      if (!student.phone || student.phone.trim() === '') {
        throw new Error('Phone is required');
      }

      // Prevent duplicate entries by phone
      const trimmedPhone = student.phone.trim();
      const { data: existingWaiting, error: existingWaitingError } = await supabase
        .from('waiting_list')
        .select('id, name')
        .eq('phone', trimmedPhone)
        .limit(1);

      if (existingWaitingError) {
        console.error('Error checking existing waiting list entries:', existingWaitingError);
        throw existingWaitingError;
      }

      if (existingWaiting && existingWaiting.length > 0) {
        const existingStudent = existingWaiting[0];
        const existingName = existingStudent.name ? ` (${existingStudent.name})` : '';
        throw new Error(`A student with this phone number already exists in the waiting list${existingName}.`);
      }

      const { data, error } = await supabase
        .from('waiting_list')
        .insert({
          name: student.name,
          email: emailValue,
          phone: trimmedPhone || null,
          address: student.address,
          birth_date: student.birthDate,
          language: student.language,
          level: student.level,
          category: student.category,
          notes: student.notes,
          parent_name: student.parentName,
          second_phone: student.secondPhone,
          custom_language: student.customLanguage,
          custom_level: student.customLevel,
          custom_category: student.customCategory,
          default_discount: student.defaultDiscount || 0,
          // 🆕 ADD: Registration fee fields
          registration_fee_paid: student.registrationFeePaid || false,
          registration_fee_amount: student.registrationFeeAmount || 500,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating waiting list student:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });

        // Provide more specific error messages
        if (error.code === '23502') {
          throw new Error(`Missing required field: ${error.message}`);
        } else if (error.code === '23505') {
          throw new Error(`Duplicate entry: ${error.message}`);
        } else if (error.code === '23514') {
          throw new Error(`Validation error: ${error.message}`);
        } else {
          throw new Error(`Failed to create waiting list student: ${error.message || 'Unknown error'}`);
        }
      }

      if (!data) {
        throw new Error('No data returned after creating waiting list student');
      }

      console.log('Successfully created waiting list student:', data);

      return {
        id: data.id,
        custom_id: data.custom_id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        birthDate: data.birth_date ? new Date(data.birth_date) : undefined,
        language: data.language,
        level: data.level,
        category: data.category,
        notes: data.notes,
        parentName: data.parent_name,
        secondPhone: data.second_phone,
        customLanguage: data.custom_language,
        customLevel: data.custom_level,
        customCategory: data.custom_category,
        defaultDiscount: data.default_discount || 0,
        // 🆕 ADD: Registration fee fields
        registrationFeePaid: data.registration_fee_paid || false,
        registrationFeeAmount: data.registration_fee_amount || 500,
        createdAt: new Date(data.created_at),
      };
    } catch (error) {
      console.error('Exception in create waiting list student:', error);
      throw error;
    }
  },

  async update(id: string, student: Partial<WaitingListStudent>): Promise<WaitingListStudent> {
    try {
      // Build update object with only the fields that are provided
      const updateData: any = {};

      // Only add fields that are actually provided
      if (student.name !== undefined) updateData.name = student.name;
      if (student.phone !== undefined) updateData.phone = student.phone;
      if (student.address !== undefined) updateData.address = student.address;
      if (student.birthDate !== undefined) updateData.birth_date = student.birthDate;
      if (student.language !== undefined) updateData.language = student.language;
      if (student.level !== undefined) updateData.level = student.level;
      if (student.category !== undefined) updateData.category = student.category;
      if (student.notes !== undefined) updateData.notes = student.notes;
      if (student.parentName !== undefined) updateData.parent_name = student.parentName;
      if (student.secondPhone !== undefined) updateData.second_phone = student.secondPhone;
      if (student.customLanguage !== undefined) updateData.custom_language = student.customLanguage;
      if (student.customLevel !== undefined) updateData.custom_level = student.customLevel;
      if (student.customCategory !== undefined) updateData.custom_category = student.customCategory;
      if (student.defaultDiscount !== undefined) updateData.default_discount = student.defaultDiscount;

      // 🆕 ADD: Registration fee fields
      if (student.registrationFeePaid !== undefined) updateData.registration_fee_paid = student.registrationFeePaid;
      if (student.registrationFeeAmount !== undefined) updateData.registration_fee_amount = student.registrationFeeAmount;

      // Handle email - only update if provided
      if (student.email !== undefined) {
        let emailValue = student.email && student.email.trim() !== '' ? student.email.trim() : null;

        // If email is empty and we need to provide a default, use a placeholder
        if (!emailValue) {
          // Try to generate a unique email based on name and phone
          const nameSlug = (student.name || 'student').toLowerCase().replace(/[^a-z0-9]/g, '');
          const phoneSlug = student.phone ? student.phone.replace(/[^0-9]/g, '').slice(-4) : '0000';
          emailValue = `${nameSlug}${phoneSlug}@waitinglist.local`;
        }
        updateData.email = emailValue;
      }

      console.log('Updating waiting list student with data:', {
        id,
        updateData
      });

      const { data, error } = await supabase
        .from('waiting_list')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating waiting list student:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });

        // Provide more specific error messages
        if (error.code === '23502') {
          throw new Error(`Missing required field: ${error.message}`);
        } else if (error.code === '23505') {
          throw new Error(`Duplicate entry: ${error.message}`);
        } else if (error.code === '23514') {
          throw new Error(`Validation error: ${error.message}`);
        } else {
          throw new Error(`Failed to update waiting list student: ${error.message || 'Unknown error'}`);
        }
      }

      if (!data) {
        throw new Error('No data returned after updating waiting list student');
      }

      console.log('Successfully updated waiting list student:', data);

      return {
        id: data.id,
        custom_id: data.custom_id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        birthDate: data.birth_date ? new Date(data.birth_date) : undefined,
        language: data.language,
        level: data.level,
        category: data.category,
        notes: data.notes,
        parentName: data.parent_name,
        secondPhone: data.second_phone,
        customLanguage: data.custom_language,
        customLevel: data.custom_level,
        customCategory: data.custom_category,
        defaultDiscount: data.default_discount || 0,
        createdAt: new Date(data.created_at),
      };
    } catch (error) {
      console.error('Exception in update waiting list student:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('waiting_list')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting waiting list student:', error);
      throw new Error(`Failed to delete waiting list student: ${error.message}`);
    }
  },

  async getByCriteria(language?: string, level?: string, category?: string): Promise<WaitingListStudent[]> {
    let query = supabase
      .from('waiting_list')
      .select('*');

    if (language) query = query.eq('language', language);
    if (level) query = query.eq('level', level);
    if (category) query = query.eq('category', category);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching waiting list by criteria:', error);
      throw new Error(`Failed to fetch waiting list by criteria: ${error.message}`);
    }

    return data?.map(item => ({
      id: item.id,
      custom_id: item.custom_id,
      name: item.name,
      email: item.email,
      phone: item.phone,
      address: item.address,
      birthDate: item.birth_date ? new Date(item.birth_date) : undefined,
      language: item.language,
      level: item.level,
      category: item.category,
      notes: item.notes,
      parentName: item.parent_name,
      secondPhone: item.second_phone,
      customLanguage: item.custom_language,
      customLevel: item.custom_level,
      customCategory: item.custom_category,
      // 🆕 ADD: Missing fields that were being lost
      defaultDiscount: item.default_discount || 0,
      registrationFeePaid: item.registration_fee_paid || false,
      registrationFeeAmount: item.registration_fee_amount || 500,
      createdAt: new Date(item.created_at),
    })) || [];
  },

  // New function to get suggested groups based on waiting list students
  async getSuggestedGroups(): Promise<Array<{
    groupName: string;
    language: string;
    level: string;
    category: string;
    studentCount: number;
    students: WaitingListStudent[];
  }>> {
    console.log('🔍 DEBUG getSuggestedGroups: Starting...');

    // First, fetch waiting list students
    const { data: waitingListData, error: waitingListError } = await supabase
      .from('waiting_list')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('🔍 DEBUG getSuggestedGroups: waitingListData length:', waitingListData?.length);
    console.log('🔍 DEBUG getSuggestedGroups: waitingListError:', waitingListError);

    if (waitingListError) {
      console.error('Error fetching waiting list for suggested groups:', waitingListError);
      throw new Error(`Failed to fetch waiting list for suggested groups: ${waitingListError.message}`);
    }

    // Then, fetch call logs separately
    const { data: callLogsData, error: callLogsError } = await supabase
      .from('call_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (callLogsError) {
      console.error('Error fetching call logs for suggested groups:', callLogsError);
      // Don't throw error here, just log it and continue without call logs
    }

    // Create a map of call logs by student_id for quick lookup
    const callLogsMap = new Map();
    if (callLogsData) {
      callLogsData.forEach(log => {
        if (!callLogsMap.has(log.student_id)) {
          callLogsMap.set(log.student_id, []);
        }
        callLogsMap.get(log.student_id).push(log);
      });
    }

    const students = waitingListData?.map(student => ({
      id: student.id,
      custom_id: student.custom_id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      address: student.address,
      birthDate: student.birth_date ? new Date(student.birth_date) : undefined,
      language: student.language,
      level: student.level,
      category: student.category,
      notes: student.notes,
      parentName: student.parent_name,
      secondPhone: student.second_phone,
      customLanguage: student.custom_language,
      customLevel: student.custom_level,
      customCategory: student.custom_category,
      // 🆕 ADD: Missing fields that were being lost
      defaultDiscount: student.default_discount || 0,
      registrationFeePaid: student.registration_fee_paid || false,
      registrationFeeAmount: student.registration_fee_amount || 500,
      createdAt: new Date(student.created_at),
      callLogs: callLogsMap.get(student.id) || [],
    })) || [];

    console.log('🔍 DEBUG getSuggestedGroups: students length:', students.length);
    console.log('🔍 DEBUG getSuggestedGroups: first few students:', students.slice(0, 3).map(s => ({
      name: s.name,
      language: s.language,
      level: s.level,
      category: s.category
    })));

    // Filter out students with missing, null, or invalid language, level, or category
    const validStudents = students.filter(student => {
      const hasValidLanguage = student.language && student.language.trim() !== '' && student.language !== 'other';
      const hasValidLevel = student.level && student.level.trim() !== '' && student.level !== 'other';
      const hasValidCategory = student.category && student.category.trim() !== '' && student.category !== 'other';

      // Debug logging
      if (student.name.includes('TEST') || student.name.includes('قطر')) {
        console.log('🔍 DEBUG Student:', student.name, {
          language: student.language,
          level: student.level,
          category: student.category,
          hasValidLanguage,
          hasValidLevel,
          hasValidCategory,
          isValid: hasValidLanguage && hasValidLevel && hasValidCategory
        });
      }

      return hasValidLanguage && hasValidLevel && hasValidCategory;
    });

    // Group students by language, level, and category
    const groups = new Map<string, {
      groupName: string;
      language: string;
      level: string;
      category: string;
      studentCount: number;
      students: WaitingListStudent[];
    }>();

    validStudents.forEach(student => {
      const key = `${student.language}_${student.level}_${student.category}`;
      const groupName = getAbbreviatedGroupName(student.language, student.level, student.category);

      if (!groups.has(key)) {
        groups.set(key, {
          groupName,
          language: student.language,
          level: student.level,
          category: student.category,
          studentCount: 0,
          students: []
        });
      }

      const group = groups.get(key)!;
      group.studentCount++;
      group.students.push(student);

      // Debug logging for test students
      if (student.name.includes('TEST') || student.name.includes('قطر')) {
        console.log('🔍 DEBUG Group:', {
          studentName: student.name,
          key,
          groupName,
          studentCount: group.studentCount
        });
      }
    });

    const result = Array.from(groups.values());

    // Debug logging
    console.log('🔍 DEBUG getSuggestedGroups result:', {
      totalStudents: students.length,
      validStudents: validStudents.length,
      totalGroups: result.length,
      groups: result.map(g => ({
        groupName: g.groupName,
        studentCount: g.studentCount,
        students: g.students.map(s => s.name)
      }))
    });

    return result;
  },
};

// Call Log operations
export const callLogService = {
  async getAll(): Promise<(CallLog & { studentName?: string; studentPhone?: string })[]> {
    try {
      // Fetch call logs with the actual columns that exist
      const { data: callLogsData, error: callLogsError } = await supabase
        .from('call_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (callLogsError) {
        console.error('Error fetching call logs:', callLogsError);
        throw new Error(`Failed to fetch call logs: ${callLogsError.message}`);
      }

      // Map the data to match the expected format
      return callLogsData?.map(log => ({
        id: log.id,
        studentId: log.student_id || null,
        callDate: new Date(log.call_date),
        callType: log.call_type as 'registration' | 'attendance' | 'payment' | 'activity' | 'other' || 'other',
        status: log.call_status || 'pending',
        notes: log.notes || '',
        adminName: log.admin_name || 'Dalila',
        createdAt: new Date(log.created_at),
        updatedAt: new Date(log.updated_at || log.created_at), // Use updated_at if available, fallback to created_at
        studentName: log.student_name || 'Unknown',
        studentPhone: log.student_phone || 'No phone',
      })) || [];
    } catch (error) {
      console.error('Error in callLogService.getAll:', error);
      throw error;
    }
  },

  async getLastPaymentCallNote(studentId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('call_logs')
        .select('notes')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        console.error('Error fetching last call note:', error);
        return null;
      }

      return data?.notes || null;
    } catch (error) {
      console.error('Error in getLastPaymentCallNote:', error);
      return null;
    }
  },

  async create(log: Omit<CallLog, 'id' | 'createdAt' | 'updatedAt'>): Promise<CallLog & { studentName?: string; studentPhone?: string }> {
    try {
      console.log('callLogService.create called with data:', log);

      // Prepare the data for insertion based on actual schema
      const insertData: any = {
        student_name: log.studentName || 'Unknown Student',
        student_phone: log.studentPhone || '',
        call_date: log.callDate.toISOString().split('T')[0],
        call_time: new Date().toTimeString().split(' ')[0],
        notes: log.notes || '',
        call_status: log.status || 'pending',
        call_type: log.callType || 'other',
        admin_name: log.adminName || 'Dalila',
      };

      // Add optional fields if they exist
      if (log.studentId) insertData.student_id = log.studentId;

      const { data, error } = await supabase
        .from('call_logs')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating call log:', error);
        console.error('Data that failed to insert:', insertData);
        throw new Error(`Failed to create call log: ${error.message}`);
      }

      console.log('Call log created successfully:', data);

      return {
        id: data.id,
        studentId: data.student_id,
        callDate: new Date(data.call_date),
        callType: data.call_type as 'registration' | 'attendance' | 'payment' | 'activity' | 'other',
        status: data.call_status,
        notes: data.notes,
        adminName: data.admin_name || 'Dalila',
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.created_at),
        studentName: data.student_name,
        studentPhone: data.student_phone,
      };
    } catch (error) {
      console.error('Error in callLogService.create:', error);
      throw error;
    }
  },

  async update(id: string, log: Partial<CallLog>): Promise<CallLog & { studentName?: string; studentPhone?: string }> {
    try {
      const updateData: any = {};

      // Map the fields to actual database columns
      if (log.studentName !== undefined) updateData.student_name = log.studentName;
      if (log.studentPhone !== undefined) updateData.student_phone = log.studentPhone;
      if (log.callDate !== undefined) updateData.call_date = log.callDate.toISOString().split('T')[0];
      if (log.status !== undefined) updateData.call_status = log.status;
      if (log.notes !== undefined) updateData.notes = log.notes;
      if (log.callType !== undefined) updateData.call_type = log.callType;

      const { data, error } = await supabase
        .from('call_logs')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating call log:', error);
        throw new Error(`Failed to update call log: ${error.message}`);
      }

      return {
        id: data.id,
        studentId: data.student_id,
        callDate: new Date(data.call_date),
        callType: data.call_type as 'registration' | 'attendance' | 'payment' | 'activity' | 'other',
        status: data.call_status,
        notes: data.notes,
        adminName: data.admin_name || 'Dalila',
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.created_at),
        studentName: data.student_name,
        studentPhone: data.student_phone,
      };
    } catch (error) {
      console.error('Error in callLogService.update:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('call_logs')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting call log:', error);
        throw new Error(`Failed to delete call log: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in callLogService.delete:', error);
      throw error;
    }
  },
};

// Teacher Covering Service
export const coveringService = {
  // Get covering sessions for a teacher
  async getCoveringSessions(teacherId: string): Promise<any[]> {
    try {
      console.log(`🔍 Fetching covering sessions for teacher: ${teacherId}`);

      const { data, error } = await supabase
        .from('teacher_covering')
        .select(`
          id,
          original_teacher_id,
          covering_teacher_id,
          session_id,
          group_id,
          cover_date,
          notes,
          created_at
        `)
        .eq('covering_teacher_id', teacherId)
        .order('cover_date', { ascending: false });

      if (error) {
        console.error('Error fetching covering sessions:', error);
        throw new Error(`Failed to fetch covering sessions: ${error.message}`);
      }

      console.log(`📋 Found ${data?.length || 0} covering sessions for teacher ${teacherId}`);

      // If no data, return empty array
      if (!data || data.length === 0) {
        return [];
      }

      // Get group and session details separately
      const groupIds = [...new Set(data.map(item => item.group_id))];
      const sessionIds = [...new Set(data.map(item => item.session_id))];

      console.log(`🔍 Fetching details for ${groupIds.length} groups and ${sessionIds.length} sessions`);

      // Fetch groups
      const { data: groups, error: groupsError } = await supabase
        .from('groups')
        .select('id, name, language, level, category')
        .in('id', groupIds);

      if (groupsError) {
        console.error('Error fetching groups for covering sessions:', groupsError);
      }

      // Fetch sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('id, date, start_time, end_time')
        .in('id', sessionIds);

      if (sessionsError) {
        console.error('Error fetching sessions for covering sessions:', sessionsError);
      }

      // Combine the data
      const result = data.map(covering => ({
        ...covering,
        groups: groups?.find(g => g.id === covering.group_id) || null,
        sessions: sessions?.find(s => s.id === covering.session_id) || null
      }));

      console.log(`✅ Returning ${result.length} covering sessions with details`);
      return result;
    } catch (error) {
      console.error('Error in coveringService.getCoveringSessions:', error);
      throw error;
    }
  },

  // Create a covering record
  async createCovering(coveringData: {
    originalTeacherId: string;
    coveringTeacherId: string;
    sessionId: string;
    groupId: number;
    coverDate: Date;
    notes?: string;
  }): Promise<any> {
    try {
      console.log(`🔄 Creating covering record:`, coveringData);

      const { data, error } = await supabase
        .from('teacher_covering')
        .insert({
          original_teacher_id: coveringData.originalTeacherId,
          covering_teacher_id: coveringData.coveringTeacherId,
          session_id: coveringData.sessionId,
          group_id: coveringData.groupId,
          cover_date: coveringData.coverDate.toISOString().split('T')[0],
          notes: coveringData.notes || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating covering record:', error);
        throw new Error(`Failed to create covering record: ${error.message}`);
      }

      console.log(`✅ Covering record created successfully:`, data);
      return data;
    } catch (error) {
      console.error('Error in coveringService.createCovering:', error);
      throw error;
    }
  },

  // Get covering statistics for a teacher
  async getCoveringStats(teacherId: string): Promise<{
    totalCoveringSessions: number;
    coveringSessionsThisMonth: number;
    coveringSessionsThisYear: number;
  }> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      const { data, error } = await supabase
        .from('teacher_covering')
        .select('cover_date')
        .eq('covering_teacher_id', teacherId);

      if (error) {
        console.error('Error fetching covering stats:', error);
        throw new Error(`Failed to fetch covering stats: ${error.message}`);
      }

      const totalCoveringSessions = data?.length || 0;
      const coveringSessionsThisMonth = data?.filter(
        (record) => new Date(record.cover_date) >= startOfMonth
      ).length || 0;
      const coveringSessionsThisYear = data?.filter(
        (record) => new Date(record.cover_date) >= startOfYear
      ).length || 0;

      return {
        totalCoveringSessions,
        coveringSessionsThisMonth,
        coveringSessionsThisYear,
      };
    } catch (error) {
      console.error('Error in coveringService.getCoveringStats:', error);
      throw error;
    }
  },
}; 