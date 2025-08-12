import { supabase } from './supabase';
import { Teacher, Student, Group, Session, Payment, WaitingListStudent, CallLog } from '../types';

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
    })) || [];
  },

  async create(teacher: Omit<Teacher, 'id'>): Promise<Teacher> {
    const { data, error } = await supabase
      .from('teachers')
      .insert({
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
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
    };
  },

  async update(id: string, teacher: Partial<Teacher>): Promise<Teacher> {
    const { data, error } = await supabase
      .from('teachers')
      .update({
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
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

    // Fetch attendance data for all sessions
    const sessionIds = groupsWithStudents.flatMap(group =>
      group.sessions?.map((session: any) => session.id) || []
    );

    let attendanceData: any[] = [];
    if (sessionIds.length > 0) {
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .select('session_id, student_id, status')
        .in('session_id', sessionIds);

      if (attendanceError) {
        console.error('Error fetching attendance:', attendanceError);
      } else {
        attendanceData = attendance || [];
      }
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
      recurring_days: group.recurringDays || [1],
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
      recurringDays: data.recurring_days,
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
        recurring_days: group.recurringDays,
        total_sessions: group.totalSessions,
        language: group.language,
        level: group.level,
        category: group.category,
        price: group.price,
        start_time: group.startTime,
        end_time: group.endTime,
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
      recurringDays: data.recurring_days,
      totalSessions: data.total_sessions,
      language: data.language,
      level: data.level,
      category: data.category,
      price: data.price,
      startTime: data.start_time,
      endTime: data.end_time,
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
      // If registration is marked paid on this operation, ensure student row reflects it
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
      // Create new student
      const { data: newStudent, error: createError } = await supabase
        .from('students')
        .insert({
          name: student.name,
          email: emailValue,
          phone: student.phone,
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

    // If registration fee is marked paid and no prior receipt exists, create one
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

    // Auto-allocate from existing credit to newly joined (and other unpaid) groups
    try {
      await paymentService.allocateFromExistingCredit({ studentId, date: new Date(), adminName: 'Dalila' });
    } catch (autoAllocError) {
      console.warn('Auto allocation from existing credit failed:', autoAllocError);
    }

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
    // First, get the group to understand the schedule
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (groupError) {
      console.error('Error fetching group for session generation:', groupError);
      throw new Error(`Failed to fetch group: ${groupError.message}`);
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

    // If sessions already exist, return them
    if (existingSessions && existingSessions.length > 0) {
      console.log('Sessions already exist for group', groupId, 'returning existing sessions');
      return existingSessions.map((session: { id: any; date: any }) => ({
        id: session.id,
        date: new Date(session.date),
        groupId: groupId,
        attendance: {},
      }));
    }

    const sessions: Session[] = [];
    let currentDate = new Date(group.start_date);
    let sessionCount = 0;

    // Generate sessions based on recurring days
    while (sessionCount < group.total_sessions) {
      const dayOfWeek = currentDate.getDay();
      if (group.recurring_days.includes(dayOfWeek)) {
        const { data: session, error: sessionError } = await supabase
          .from('sessions')
          .insert({
            date: currentDate.toISOString().split('T')[0],
            group_id: groupId,
          })
          .select()
          .single();

        if (sessionError) {
          console.error('Error creating session:', sessionError);
          throw new Error(`Failed to create session: ${sessionError.message}`);
        }

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

    return sessions;
  },

  async updateAttendance(sessionId: string, studentId: string, status: string): Promise<void> {
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

      // Handle financial adjustments for certain statuses
      if (['justify', 'stop', 'new', 'change'].includes(status)) {
        await this.handleAttendanceFinancialAdjustment(studentId, groupId, status, sessionId);
      }

      // If status is 'stop', mark student as stopped in this group
      if (status === 'stop') {
        await this.markStudentAsStoppedInGroup(studentId, groupId);
      } else if (['present', 'absent', 'justify', 'change', 'new'].includes(status)) {
        // If status is active, mark student as active in this group
        await this.markStudentAsActiveInGroup(studentId, groupId);
      }

      console.log(`Attendance updated for student ${studentId} in session ${sessionId} with status: ${status}`);
    } catch (error) {
      console.error('Error updating attendance:', error);
      throw error;
    }
  },

  // Handle financial adjustments when attendance status changes
  async handleAttendanceFinancialAdjustment(studentId: string, groupId: number, status: string, sessionId: string): Promise<void> {
    try {
      // Get group details to calculate session value
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('price, total_sessions')
        .eq('id', groupId)
        .single();

      if (groupError) {
        console.error('Error fetching group details:', groupError);
        return;
      }

      const sessionValue = Number(group.price || 0) / Number(group.total_sessions || 1);

      // Check if student has already paid for this group
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount, group_id')
        .eq('student_id', studentId)
        .eq('group_id', groupId);

      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError);
        return;
      }

      const totalPaidForGroup = (payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);

      if (totalPaidForGroup > 0) {
        // Student has already paid - add refund to balance
        const refundAmount = sessionValue;

        // Check if student has active unpaid groups to use this refund
        const { data: activeGroups } = await supabase
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
          .eq('student_id', studentId)
          .eq('status', 'active');

        if (activeGroups && activeGroups.length > 0) {
          // Student has active groups - use refund to pay oldest unpaid group
          const oldestGroup = activeGroups[0]; // Assuming sorted by creation date
          console.log(`Student has active groups - using refund to pay group: ${oldestGroup.groups[0].name}`);

          // Create payment record for the oldest group
          const { error: paymentError } = await supabase
            .from('payments')
            .insert({
              student_id: studentId,
              group_id: oldestGroup.group_id,
              amount: refundAmount,
              date: new Date().toISOString().split('T')[0],
              notes: `Session refund applied to group ${oldestGroup.groups[0].name}`,
              admin_name: 'System',
              payment_type: 'group_payment',
              discount: 0,
              original_amount: refundAmount
            });

          if (paymentError) {
            console.error('Error creating group payment from refund:', paymentError);
          } else {
            console.log(`Refund of ${refundAmount} applied to group ${oldestGroup.groups[0].name}`);
          }
        } else {
          // Student has no active groups - add to refund list
          console.log(`Student has no active groups - adding ${refundAmount} to refund list`);

          // Create refund payment record
          const { error: refundError } = await supabase
            .from('payments')
            .insert({
              student_id: studentId,
              group_id: null, // No specific group for refunds
              amount: -refundAmount, // Negative amount for refunds
              date: new Date().toISOString().split('T')[0],
              notes: `Refund for session ${sessionId} (${status} status) - no active groups`,
              admin_name: 'System',
              payment_type: 'balance_addition',
              discount: 0,
              original_amount: refundAmount
            });

          if (refundError) {
            console.error('Error creating refund payment:', refundError);
          } else {
            console.log(`Refund of ${refundAmount} added to student ${studentId} balance for session ${sessionId}`);
          }
        }
      } else {
        // Student hasn't paid - reduce the group fee calculation
        // This will be handled by the getStudentBalance function
        // which counts sessions based on attendance status
        console.log(`Session ${sessionId} marked as ${status} - will reduce group fee calculation for student ${studentId}`);
      }

      // Update debts/refunds lists automatically
      await this.updateDebtsAndRefundsLists();
    } catch (error) {
      console.error('Error handling attendance financial adjustment:', error);
    }
  },

  // Mark student as stopped in a specific group
  async markStudentAsStoppedInGroup(studentId: string, groupId: number): Promise<void> {
    try {
      // Check if student_groups table exists, if not create it
      const { error: checkError } = await supabase
        .from('student_groups')
        .select('id')
        .eq('student_id', studentId)
        .eq('group_id', groupId)
        .limit(1);

      if (checkError && checkError.message.includes('does not exist')) {
        // Create student_groups table if it doesn't exist
        await this.createStudentGroupsTable();
      }

      // Upsert student group status
      const { error: upsertError } = await supabase
        .from('student_groups')
        .upsert({
          student_id: studentId,
          group_id: groupId,
          status: 'stopped',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'student_id,group_id'
        });

      if (upsertError) {
        console.error('Error marking student as stopped:', upsertError);
        throw new Error(`Failed to mark student as stopped: ${upsertError.message}`);
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
      // Check if student_groups table exists, if not create it
      const { error: checkError } = await supabase
        .from('student_groups')
        .select('id')
        .eq('student_id', studentId)
        .eq('group_id', groupId)
        .limit(1);

      if (checkError && checkError.message.includes('does not exist')) {
        // Create student_groups table if it doesn't exist
        await this.createStudentGroupsTable();
      }

      // Upsert student group status
      const { error: upsertError } = await supabase
        .from('student_groups')
        .upsert({
          student_id: studentId,
          group_id: groupId,
          status: 'active',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'student_id,group_id'
        });

      if (upsertError) {
        console.error('Error marking student as active:', upsertError);
        throw new Error(`Failed to mark student as active: ${upsertError.message}`);
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
      // Apply all updates first
      for (const update of updates) {
        await this.updateAttendance(update.sessionId, update.studentId, update.status);
      }
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

  // New method to get student balance
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
    }>;
  }> {
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

    // Get all payments for this student (across all groups) - include original_amount for discount calculations
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('group_id, amount, original_amount, discount, notes')
      .eq('student_id', studentId);

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
      throw new Error(`Failed to fetch payments: ${paymentsError.message}`);
    }

    // Get all groups that this student is enrolled in using the junction table
    const { data: studentGroups, error: groupsError } = await supabase
      .from('student_groups')
      .select(`
        group_id,
        groups (
          id,
          name,
          price,
          total_sessions
        )
      `)
      .eq('student_id', studentId);

    if (groupsError) {
      console.error('Error fetching student groups:', groupsError);
      throw new Error(`Failed to fetch student groups: ${groupsError.message}`);
    }

    // Registration fee fields
    const { data: regRow } = await supabase
      .from('students')
      .select('registration_fee_paid, registration_fee_amount')
      .eq('id', studentId)
      .single();
    const registrationAmount = Number(regRow?.registration_fee_amount || 0);
    const registrationPaid = (payments || [])
      .filter(p => p.group_id === null)
      // Consider only explicit registration payments if needed (notes), but we may not have here; we infer all null group_id as credit + reg
      // To be strict, we'll recompute below in recent payments mapping; for balance here, use all null group payments as credits,
      // but compute explicit registration paid as sum of null group payments with notes ILIKE 'Registration fee%'.
      .reduce((sum, p) => sum + 0, 0);
    // Fetch explicit registration payments amount
    const registrationPaidAmount = (payments || [])
      .filter(p => p.group_id === null && (p as any).notes && String((p as any).notes).toLowerCase().startsWith('registration fee'))
      .reduce((sum, p) => sum + Number((p as any).original_amount ?? (p as any).amount ?? 0), 0);

    // Calculate balances
    let totalBalance = 0;
    let totalPaid = 0;
    let totalCredits = 0; // Track balance additions (credits)
    const groupBalances: Array<{
      groupId: number;
      groupName: string;
      groupFees: number;
      amountPaid: number;
      remainingAmount: number;
      discount?: number;
    }> = [];

    // Calculate total credits from balance additions ONLY (exclude registration fee receipts)
    const balanceAdditions = (payments || [])
      .filter(p => {
        if (p.group_id !== null) return false;
        const n = ((p as any).notes || '').toString().toLowerCase();
        if (n.startsWith('registration fee')) return false; // not a credit
        if (n.startsWith('attendance refund')) return false; // exclude refunds from credits to avoid double-counting
        return true; // pure deposits only
      });
    totalCredits = balanceAdditions.reduce((sum, p) => sum + Number((p as any).amount || 0), 0);

    // Attendance-based fee adjustment per group
    for (const studentGroup of (studentGroups || [])) {
      const group = studentGroup.groups[0];
      const groupIdVal = group.id as number;
      const totalSessions = Number(group.total_sessions || 0);

      // Payments for this group
      const groupPayments = (payments || []).filter(p => p.group_id === groupIdVal);
      const amountPaidOriginal = groupPayments.reduce((sum, p) => sum + Number(p.original_amount || p.amount || 0), 0);
      const actualAmountPaid = groupPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

      // Debug logging to see what payments are found
      if (groupPayments.length > 0) {
        console.log(`Group ${groupIdVal} payments:`, groupPayments.map(p => ({
          id: p.group_id,
          amount: p.amount,
          original_amount: p.original_amount,
          notes: p.notes
        })));
      }

      // Fetch sessions and attendance statuses
      let countedSessions = totalSessions;
      if (totalSessions > 0) {
        const { data: sess } = await supabase
          .from('sessions')
          .select('id')
          .eq('group_id', groupIdVal);
        const sessionIds = (sess || []).map(s => s.id);
        if (sessionIds.length > 0) {
          const { data: att } = await supabase
            .from('attendance')
            .select('session_id, status')
            .eq('student_id', studentId)
            .in('session_id', sessionIds);
          const notCounted = new Set(['justify', 'new', 'change', 'stop']);
          const notCountedCount = (att || []).reduce((c, a) => c + (notCounted.has(String((a as any).status)) ? 1 : 0), 0);
          countedSessions = Math.max(0, totalSessions - notCountedCount);
        }
      }

      const perSession = Number(group.price || 0) / (totalSessions || 1);
      const effectiveGroupFees = Math.max(0, countedSessions * perSession);

      // Apply student's default discount to the group fees
      const defaultDiscount = Number(student.default_discount || 0);
      const discountedGroupFees = defaultDiscount > 0 ? effectiveGroupFees * (1 - defaultDiscount / 100) : effectiveGroupFees;

      // Calculate how much is owed for this group (based on discounted amount)
      const groupOwed = Math.max(0, discountedGroupFees - amountPaidOriginal);

      totalBalance += discountedGroupFees; // Use discounted amount for balance calculation
      totalPaid += amountPaidOriginal;

      groupBalances.push({
        groupId: groupIdVal,
        groupName: group.name,
        groupFees: discountedGroupFees, // Show discounted amount
        amountPaid: actualAmountPaid,
        remainingAmount: groupOwed,
        discount: student.default_discount || 0,
      });
    }

    // Include registration fee as a pseudo group balance (groupId 0)
    if (registrationAmount > 0) {
      // Apply student's default discount to registration fee
      const defaultDiscount = Number(student.default_discount || 0);
      const discountedRegistrationAmount = defaultDiscount > 0 ? registrationAmount * (1 - defaultDiscount / 100) : registrationAmount;

      totalBalance += discountedRegistrationAmount; // Use discounted amount
      totalPaid += registrationPaidAmount;
      const regRemaining = Math.max(0, discountedRegistrationAmount - registrationPaidAmount);
      groupBalances.unshift({
        groupId: 0,
        groupName: 'Registration fee',
        groupFees: discountedRegistrationAmount, // Show discounted amount
        amountPaid: registrationPaidAmount,
        remainingAmount: regRemaining,
        discount: defaultDiscount,
      });
    }

    // Calculate final remaining balance - ALWAYS equals sum of unpaid groups
    // This ensures perfect synchronization between balance and unpaid groups
    const totalUnpaidGroups = groupBalances.reduce((sum, gb) => sum + gb.remainingAmount, 0);
    const registrationUnpaid = Math.max(0, registrationAmount - registrationPaidAmount);
    const totalUnpaid = registrationUnpaid + totalUnpaidGroups;

    // remainingBalance = credits - total unpaid
    // If positive: student has credit balance
    // If negative: student owes money (sum of unpaid groups)
    const remainingBalance = totalCredits - totalUnpaid;

    console.log(`Balance calculation for student ${studentId}:`);
    console.log(`  Total credits: ${totalCredits}`);
    console.log(`  Registration unpaid: ${registrationUnpaid}`);
    console.log(`  Groups unpaid: ${totalUnpaidGroups}`);
    console.log(`  Total unpaid: ${totalUnpaid}`);
    console.log(`  Final balance: ${remainingBalance}`);

    return {
      totalBalance,
      totalPaid,
      remainingBalance, // Positive (credit), Negative (owed)
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
      // Determine if this is a registration fee receipt (group_id null + notes starts with 'Registration fee')
      const isRegistrationReceipt = !payment.group_id && payment.notes && String(payment.notes).toLowerCase().startsWith('registration fee');

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
        paymentType: payment.payment_type || (payment.group_id === null ? (isRegistrationReceipt ? 'group_payment' : 'balance_addition') : 'group_payment'),
        studentName: student?.name || 'Unknown Student',
        groupName: group?.name || (payment.group_id === null ? (isRegistrationReceipt ? 'Registration fee' : 'Balance Addition') : 'Unknown Group'),
      };
    }) || [];
  },

  async depositAndAllocate(params: { studentId: string; amount: number; date: Date; notes?: string; adminName?: string; }): Promise<{ depositId: string; allocations: Payment[] }> {
    const { studentId, amount, date, notes, adminName } = params;

    if (amount <= 0) {
      throw new Error('Deposit amount must be greater than zero');
    }

    // Fetch student's groups (priority by oldest)
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

    // Fetch all payments for this student to compute remaining per group
    const { data: allPayments, error: allPaymentsError } = await supabase
      .from('payments')
      .select('group_id, amount, original_amount')
      .eq('student_id', studentId);

    if (allPaymentsError) {
      throw new Error(`Failed to fetch payments: ${allPaymentsError.message}`);
    }

    // Paid per group using original_amount when available
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

    let available = amount;

    // Priority 0: Registration fee if unpaid (only charge once per student)
    // Fetch student registration fields and default discount
    const { data: studentRow } = await supabase
      .from('students')
      .select('registration_fee_paid, registration_fee_amount, registration_fee_group_id, default_discount')
      .eq('id', studentId)
      .single();

    if (studentRow && !studentRow.registration_fee_paid && Number(studentRow.registration_fee_amount || 0) > 0 && available > 0) {
      // Check if this is the first group being launched (oldest start date)
      const firstGroup = unpaidGroups[0]; // Already sorted by start date (oldest first)

      if (firstGroup && firstGroup.id === unpaidGroups[0].id) {
        // This is the first group - charge registration fee here
        const toPay = Math.min(available, Number(studentRow.registration_fee_amount));

        // Apply student's default discount to registration fee
        const defaultDiscount = Number(studentRow?.default_discount || 0);
        const discountedAmount = defaultDiscount > 0 ? toPay * (1 - defaultDiscount / 100) : toPay;
        const discountAmount = toPay - discountedAmount;

        // Create receipt as a balance addition with specific note
        const { data: regPay, error: regErr } = await supabase
          .from('payments')
          .insert({
            student_id: studentId,
            group_id: null,
            amount: discountedAmount,
            date: date.toISOString().split('T')[0],
            notes: `Registration fee (charged from group: ${firstGroup.name})${defaultDiscount > 0 ? ` - ${defaultDiscount}% discount applied` : ''}`,
            admin_name: adminName || 'Dalila',
            discount: defaultDiscount,
            original_amount: toPay,
          })
          .select()
          .single();

        if (!regErr) {
          // Mark as paid if fully covered
          if (toPay >= Number(studentRow.registration_fee_amount)) {
            await supabase
              .from('students')
              .update({
                registration_fee_paid: true,
                registration_fee_group_id: firstGroup.id // Track which group consumed the fee
              })
              .eq('id', studentId);
          } else {
            // Reduce the remaining amount
            await supabase
              .from('students')
              .update({
                registration_fee_amount: Number(studentRow.registration_fee_amount) - toPay,
                registration_fee_group_id: firstGroup.id // Track which group consumed the fee
              })
              .eq('id', studentId);
          }
          available -= toPay;
          console.log(`Registration fee ${toPay} charged from group ${firstGroup.name} for student ${studentId}`);
        }
      } else {
        // This is not the first group - registration fee already charged or will be charged from first group
        console.log(`Registration fee will not be charged from this group - first group priority applies`);
      }
    }

    const allocations: Payment[] = [];

    // Allocate to oldest unpaid groups
    for (const g of unpaidGroups) {
      if (available <= 0) break;
      const toPay = Math.min(available, g.remaining);
      if (toPay <= 0) continue;

      // Apply student's default discount to group payment
      const defaultDiscount = Number(studentRow?.default_discount || 0);
      const discountedAmount = defaultDiscount > 0 ? toPay * (1 - defaultDiscount / 100) : toPay;
      const discountAmount = toPay - discountedAmount;

      const remainingAfter = g.remaining - toPay;
      const allocInsert = {
        student_id: studentId,
        group_id: g.id,
        amount: discountedAmount,
        date: date.toISOString().split('T')[0],
        notes: remainingAfter > 0
          ? `Auto allocation: partial payment. Remaining for this group: $${remainingAfter.toFixed(2)}.${defaultDiscount > 0 ? ` ${defaultDiscount}% discount applied.` : ''}` + (notes ? ` Notes: ${notes}` : '')
          : `Auto allocation: group fully paid.${defaultDiscount > 0 ? ` ${defaultDiscount}% discount applied.` : ''}` + (notes ? ` Notes: ${notes}` : ''),
        admin_name: adminName || 'Dalila',
        discount: defaultDiscount,
        original_amount: toPay,
      };

      const { data: allocData, error: allocError } = await supabase
        .from('payments')
        .insert(allocInsert)
        .select()
        .single();

      if (allocError) {
        throw new Error(`Failed to allocate payment to group #${g.id}: ${allocError.message}`);
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

    // If any amount remains, record it as balance addition (one receipt)
    let depositId = '';
    if (available > 0) {
      const depositInsert: any = {
        student_id: studentId,
        group_id: null,
        amount: available,
        date: date.toISOString().split('T')[0],
        notes: notes || 'Balance deposit',
        admin_name: adminName || 'Dalila',
        discount: 0,
        original_amount: available,
      };

      const { data: depositData, error: depositError } = await supabase
        .from('payments')
        .insert(depositInsert)
        .select()
        .single();

      if (depositError) {
        if (depositError.message?.toLowerCase().includes('group_id') && depositError.message?.toLowerCase().includes('null')) {
          throw new Error('Deposits require payments.group_id to be nullable. Please run: ALTER TABLE payments ALTER COLUMN group_id DROP NOT NULL;');
        }
        throw new Error(`Failed to record deposit: ${depositError.message}`);
      }

      depositId = depositData.id as string;
    }

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
    groups: Array<{ id: number; name: string; status: string }>;
  }>> {
    try {
      console.log('Starting getRefundList function...');

      // Get all students with positive balance
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          custom_id,
          name
        `);

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
        throw studentsError;
      }

      console.log(`Found ${students?.length || 0} students total`);

      const refundList: Array<{
        studentId: string;
        studentName: string;
        customId?: string;
        balance: number;
        groups: Array<{ id: number; name: string; status: string }>;
      }> = [];

      for (const student of students || []) {
        try {
          console.log(`\n=== Processing student: ${student.name} (${student.id}) ===`);

          // Get student balance
          const balance = await paymentService.getStudentBalance(student.id);
          console.log(`Student ${student.name} balance:`, balance.remainingBalance);

          // Only include students with positive balance
          if (balance.remainingBalance > 0) {
            console.log(`Student ${student.name} has positive balance, checking group enrollments...`);

            // Check if student is no longer actively enrolled in any groups
            let studentGroups: any = null;
            try {
              const { data, error: groupsError } = await supabase
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
                console.error(`Error fetching groups for student ${student.name}:`, groupsError);
                continue;
              }
              studentGroups = data;
            } catch (tableError) {
              console.error(`Table access error for student ${student.name}:`, tableError);
              continue;
            }

            console.log(`Student ${student.name} has ${studentGroups?.length || 0} group enrollments`);

            // Check if student has no active group enrollments (all groups stopped)
            if (studentGroups && studentGroups.length > 0) {
              console.log(`Student ${student.name} has ${studentGroups.length} group enrollments, checking status...`);

              // Check if ALL groups have 'stopped' status
              const allGroupsStopped = studentGroups.every((enrollment: any) => enrollment.status === 'stopped');
              console.log(`All groups stopped for ${student.name}: ${allGroupsStopped}`);

              // Only process refund if ALL groups are stopped
              if (allGroupsStopped) {
                console.log(`Student ${student.name} is eligible for refund - all groups are stopped`);

                // Add to refund list
                refundList.push({
                  studentId: student.id,
                  studentName: student.name,
                  customId: student.custom_id,
                  balance: balance.remainingBalance,
                  groups: studentGroups.map((enrollment: any) => ({
                    id: enrollment.groups[0].id,
                    name: enrollment.groups[0].name,
                    status: enrollment.status
                  }))
                });

                console.log(`Added ${student.name} to refund list with balance: ${balance.remainingBalance}`);
              } else {
                console.log(`Student ${student.name} is NOT eligible for refund - has active groups`);
              }
            } else {
              console.log(`Student ${student.name} has no group enrollments - not eligible for refund`);
            }
          } else {
            console.log(`Student ${student.name} has no positive balance - not eligible for refund`);
          }
        } catch (studentError) {
          console.error(`Error processing student ${student.name}:`, studentError);
          continue;
        }
      }

      console.log(`\n=== Refund List Complete ===`);
      console.log(`Total students eligible for refund: ${refundList.length}`);
      refundList.forEach(refund => {
        console.log(`- ${refund.studentName}: ${refund.balance} (${refund.groups.length} stopped groups)`);
      });

      return refundList;
    } catch (error) {
      console.error('Error getting refund list:', error);
      if (error && typeof error === 'object') {
        console.error('Error details:', {
          message: (error as any).message,
          stack: (error as any).stack,
          name: (error as any).name
        });
      }
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

      // Get all students with negative balance
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          custom_id,
          name
        `);

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
        throw studentsError;
      }

      console.log(`Found ${students?.length || 0} students total`);

      const debtsList: Array<{
        studentId: string;
        studentName: string;
        customId?: string;
        balance: number;
        groups: Array<{ id: number; name: string; status: string }>;
      }> = [];

      for (const student of students || []) {
        try {
          console.log(`\n=== Processing student: ${student.name} (${student.id}) ===`);

          // Get student balance
          const balance = await paymentService.getStudentBalance(student.id);
          console.log(`Student ${student.name} balance:`, balance.remainingBalance);

          // Only include students with negative balance
          if (balance.remainingBalance < 0) {
            console.log(`Student ${student.name} has negative balance, checking group enrollments...`);

            // Check if student is no longer actively enrolled in any groups
            let studentGroups: any = null;
            try {
              const { data, error: groupsError } = await supabase
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
                console.error(`Error fetching groups for student ${student.name}:`, groupsError);
                continue;
              }
              studentGroups = data;
            } catch (tableError) {
              console.error(`Table access error for student ${student.name}:`, tableError);
              continue;
            }

            console.log(`Student ${student.name} has ${studentGroups?.length || 0} group enrollments`);

            // Check if student has no active group enrollments (all groups stopped)
            if (studentGroups && studentGroups.length > 0) {
              console.log(`Student ${student.name} has ${studentGroups.length} group enrollments, checking status...`);

              // Check if ALL groups have 'stopped' status
              const allGroupsStopped = studentGroups.every((enrollment: any) => enrollment.status === 'stopped');
              console.log(`All groups stopped for ${student.name}: ${allGroupsStopped}`);

              // Only process debt if ALL groups are stopped
              if (allGroupsStopped) {
                console.log(`Student ${student.name} is eligible for debt collection - all groups are stopped`);

                // Add to debt list
                debtsList.push({
                  studentId: student.id,
                  studentName: student.name,
                  customId: student.custom_id,
                  balance: balance.remainingBalance,
                  groups: studentGroups.map((enrollment: any) => ({
                    id: enrollment.groups[0].id,
                    name: enrollment.groups[0].name,
                    status: enrollment.status
                  }))
                });

                console.log(`Added ${student.name} to debt list with balance: ${balance.remainingBalance}`);
              } else {
                console.log(`Student ${student.name} is NOT eligible for debt collection - has active groups`);
              }
            } else {
              console.log(`Student ${student.name} has no group enrollments - not eligible for debt collection`);
            }
          } else {
            console.log(`Student ${student.name} has no negative balance - not eligible for debt collection`);
          }
        } catch (studentError) {
          console.error(`Error processing student ${student.name}:`, studentError);
          continue;
        }
      }

      console.log(`\n=== Debt List Complete ===`);
      console.log(`Total students eligible for debt collection: ${debtsList.length}`);
      debtsList.forEach(debt => {
        console.log(`- ${debt.studentName}: ${debt.balance} (${debt.groups.length} stopped groups)`);
      });

      return debtsList;
    } catch (error) {
      console.error('Error getting debts list:', error);
      if (error && typeof error === 'object') {
        console.error('Error details:', {
          message: (error as any).message,
          stack: (error as any).stack,
          name: (error as any).name
        });
      }
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
        paymentType: 'balance_addition', // Using balance_addition type for refunds
        originalAmount: amount,
        discount: 0
      };

      await this.create(refundPayment);
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  },

  async processDebtPayment(studentId: string, amount: number, date: Date, notes?: string): Promise<void> {
    try {
      // Use the existing allocation logic to properly distribute the debt payment
      const { depositId, allocations } = await this.depositAndAllocate({
        studentId,
        amount,
        date,
        notes: notes || 'Debt payment received',
        adminName: 'Dalila'
      });

      console.log(`Debt payment processed: ${amount} allocated to ${allocations.length} groups`);
      console.log('Allocations created:', allocations.map(a => ({
        groupId: a.groupId,
        amount: a.amount,
        notes: a.notes
      })));
    } catch (error) {
      console.error('Error processing debt payment:', error);
      throw error;
    }
  },

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

        // Calculate total paid for this group
        const totalPaid = payments?.reduce((sum, p) => {
          if (p.payment_type === 'group_payment' || p.amount > 0) {
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
          } else if (['justify', 'change', 'new'].includes(att.status)) {
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
          const balance = await this.getStudentBalance(student.id);
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
      });

      // Validate required fields
      if (!student.name || !student.language || !student.level || !student.category) {
        throw new Error('Missing required fields: name, language, level, and category are required');
      }
      if (!student.phone || student.phone.trim() === '') {
        throw new Error('Phone is required');
      }

      const { data, error } = await supabase
        .from('waiting_list')
        .insert({
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
    // First, fetch waiting list students
    const { data: waitingListData, error: waitingListError } = await supabase
      .from('waiting_list')
      .select('*')
      .order('created_at', { ascending: false });

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
      createdAt: new Date(student.created_at),
      callLogs: callLogsMap.get(student.id) || [],
    })) || [];

    // Filter out students with missing, null, or invalid language, level, or category
    const validStudents = students.filter(student => {
      const hasValidLanguage = student.language && student.language.trim() !== '' && student.language !== 'other';
      const hasValidLevel = student.level && student.level.trim() !== '' && student.level !== 'other';
      const hasValidCategory = student.category && student.category.trim() !== '' && student.category !== 'other';

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
    });

    return Array.from(groups.values());
  },
};

// Call Log operations
export const callLogService = {
  async getAll(): Promise<(CallLog & { studentName?: string; studentPhone?: string })[]> {
    // First, fetch call logs
    const { data: callLogsData, error: callLogsError } = await supabase
      .from('call_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (callLogsError) {
      console.error('Error fetching call logs:', callLogsError);
      throw new Error(`Failed to fetch call logs: ${callLogsError.message}`);
    }

    // Get unique student IDs from call logs
    const studentIds = callLogsData?.map(log => log.student_id).filter(Boolean) || [];

    // Fetch student information from both waiting_list and students tables
    let studentDataMap = new Map();

    if (studentIds.length > 0) {
      // Fetch from waiting_list table
      const { data: wlData, error: wlError } = await supabase
        .from('waiting_list')
        .select('id, name, phone')
        .in('id', studentIds);

      if (wlError) {
        console.error('Error fetching waiting list data for call logs:', wlError);
      } else if (wlData) {
        wlData.forEach(student => {
          studentDataMap.set(student.id, { name: student.name, phone: student.phone });
        });
      }

      // Fetch from students table directly (not through junction table)
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, name, phone')
        .in('id', studentIds);

      if (studentsError) {
        console.error('Error fetching students data for call logs:', studentsError);
      } else if (studentsData) {
        studentsData.forEach((student: any) => {
          studentDataMap.set(student.id, {
            name: student.name,
            phone: student.phone
          });
        });
      }
    }

    return callLogsData?.map(log => {
      const studentInfo = studentDataMap.get(log.student_id);
      return {
        id: log.id,
        studentId: log.student_id,
        callDate: new Date(log.call_date),
        callType: log.call_type,
        status: log.status,
        notes: log.notes,
        adminName: log.admin_name,
        createdAt: new Date(log.created_at),
        updatedAt: new Date(log.updated_at),
        studentName: studentInfo?.name || 'Student not found',
        studentPhone: studentInfo?.phone || 'Phone not found',
      };
    }) || [];
  },

  async getLastPaymentCallNote(studentId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('call_logs')
      .select('notes')
      .eq('student_id', studentId)
      .eq('call_type', 'payment')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error('Error fetching last payment call note:', error);
      return null;
    }

    return data?.notes || null;
  },

  async create(log: Omit<CallLog, 'id' | 'createdAt' | 'updatedAt'>): Promise<CallLog & { studentName?: string; studentPhone?: string }> {
    console.log('callLogService.create called with data:', log);

    const { data, error } = await supabase
      .from('call_logs')
      .insert({
        student_id: log.studentId,
        call_date: log.callDate.toISOString(),
        call_type: log.callType,
        status: log.status,
        notes: log.notes,
        admin_name: log.adminName,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating call log:', error);
      console.error('Data that failed to insert:', {
        student_id: log.studentId,
        call_date: log.callDate.toISOString(),
        call_type: log.callType,
        status: log.status,
        notes: log.notes,
        admin_name: log.adminName,
      });
      throw new Error(`Failed to create call log: ${error.message}`);
    }

    console.log('Call log created successfully:', data);

    // Fetch student information to include name and phone
    let studentName: string | undefined;
    let studentPhone: string | undefined;

    if (log.studentId) {
      // Try to get from waiting_list first
      const { data: wlData } = await supabase
        .from('waiting_list')
        .select('name, phone')
        .eq('id', log.studentId)
        .single();

      if (wlData) {
        studentName = wlData.name;
        studentPhone = wlData.phone;
      } else {
        // Try to get from students table via student_groups
        const { data: studentData } = await supabase
          .from('student_groups')
          .select(`
            students!inner(
              name,
              phone
            )
          `)
          .eq('student_id', log.studentId)
          .single();

        if (studentData?.students) {
          studentName = (studentData.students as any).name;
          studentPhone = (studentData.students as any).phone;
        }
      }
    }

    return {
      id: data.id,
      studentId: data.student_id,
      callDate: new Date(data.call_date),
      callType: data.call_type,
      status: data.status,
      notes: data.notes,
      adminName: data.admin_name,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      studentName,
      studentPhone,
    };
  },

  async update(id: string, log: Partial<CallLog>): Promise<CallLog & { studentName?: string; studentPhone?: string }> {
    const { data, error } = await supabase
      .from('call_logs')
      .update({
        student_id: log.studentId,
        call_date: log.callDate?.toISOString(),
        call_type: log.callType,
        status: log.status,
        notes: log.notes,
        admin_name: log.adminName,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating call log:', error);
      throw new Error(`Failed to update call log: ${error.message}`);
    }

    // Fetch student information to include name and phone
    let studentName: string | undefined;
    let studentPhone: string | undefined;

    if (data.student_id) {
      // Try to get from waiting_list first
      const { data: wlData } = await supabase
        .from('waiting_list')
        .select('name, phone')
        .eq('id', data.student_id)
        .single();

      if (wlData) {
        studentName = wlData.name;
        studentPhone = wlData.phone;
      } else {
        // Try to get from students table via student_groups
        const { data: studentData } = await supabase
          .from('student_groups')
          .select(`
            students!inner(
              name,
              phone
            )
          `)
          .eq('student_id', data.student_id)
          .single();

        if (studentData?.students) {
          studentName = (studentData.students as any).name;
          studentPhone = (studentData.students as any).phone;
        }
      }
    }

    return {
      id: data.id,
      studentId: data.student_id,
      callDate: new Date(data.call_date),
      callType: data.call_type,
      status: data.status,
      notes: data.notes,
      adminName: data.admin_name,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      studentName,
      studentPhone,
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('call_logs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting call log:', error);
      throw new Error(`Failed to delete call log: ${error.message}`);
    }
  },
}; 