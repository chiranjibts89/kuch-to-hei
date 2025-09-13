import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import {
  supabase,
  UserProfile,
  StudentProfile,
  TeacherProfile,
  Lesson,
  Challenge,
  Badge,
  StudentBadge,
  StudentLesson,
  StudentChallenge,
  ShopItem,
  StudentPurchase,
} from "../lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  studentProfile: StudentProfile | null;
  teacherProfile: TeacherProfile | null;
  studentBadges: StudentBadge[];
  studentLessons: StudentLesson[];
  studentChallenges: StudentChallenge[];
  studentPurchases: StudentPurchase[];
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    userData: SignUpData
  ) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: any }>;
  updateStudentProfile: (
    updates: Partial<StudentProfile>
  ) => Promise<{ error: any }>;
  completeLesson: (lessonId: string, score?: number) => Promise<{ error: any }>;
  completeChallenge: (
    challengeId: string,
    evidenceUrls?: string[]
  ) => Promise<{ error: any }>;
  awardBadge: (badgeId: string) => Promise<{ error: any }>;
  purchaseItem: (itemId: string, price: number) => Promise<{ error: any }>;
  refreshStudentData: () => Promise<void>;
}

interface SignUpData {
  fullName: string;
  role: "student" | "teacher";
  // Student specific
  grade?: string;
  school: string;
  state: string;
  // Teacher specific
  subject?: string;
  experienceYears?: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(
    null
  );
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(
    null
  );
  const [studentBadges, setStudentBadges] = useState<StudentBadge[]>([]);
  const [studentLessons, setStudentLessons] = useState<StudentLesson[]>([]);
  const [studentChallenges, setStudentChallenges] = useState<
    StudentChallenge[]
  >([]);
  const [studentPurchases, setStudentPurchases] = useState<StudentPurchase[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await loadUserProfile(session.user.id);
      } else {
        setUserProfile(null);
        setStudentProfile(null);
        setTeacherProfile(null);
        setStudentBadges([]);
        setStudentLessons([]);
        setStudentChallenges([]);
        setStudentPurchases([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      // Load user profile
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;
      setUserProfile(profile);

      // Load role-specific profile
      if (profile.role === "student") {
        const { data: studentData, error: studentError } = await supabase
          .from("students")
          .select("*")
          .eq("id", userId)
          .single();

        if (studentError && studentError.code !== "PGRST116") {
          console.error("Error loading student profile:", studentError);
        } else {
          setStudentProfile(studentData);
          if (studentData) {
            await loadStudentData(userId);
          }
        }
      } else if (profile.role === "teacher") {
        const { data: teacherData, error: teacherError } = await supabase
          .from("teachers")
          .select("*")
          .eq("id", userId)
          .single();

        if (teacherError && teacherError.code !== "PGRST116") {
          console.error("Error loading teacher profile:", teacherError);
        } else {
          setTeacherProfile(teacherData);
        }
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentData = async (userId: string) => {
    try {
      // Load student badges
      const { data: badgesData, error: badgesError } = await supabase
        .from("student_badges")
        .select(
          `
          *,
          badge:badges(*)
        `
        )
        .eq("student_id", userId);

      if (badgesError) {
        console.error("Error loading student badges:", badgesError);
      } else {
        setStudentBadges(badgesData || []);
      }

      // Load student lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from("student_lessons")
        .select(
          `
          *,
          lesson:lessons(*)
        `
        )
        .eq("student_id", userId);

      if (lessonsError) {
        console.error("Error loading student lessons:", lessonsError);
      } else {
        setStudentLessons(lessonsData || []);
      }

      // Load student challenges
      const { data: challengesData, error: challengesError } = await supabase
        .from("student_challenges")
        .select(
          `
          *,
          challenge:challenges(*)
        `
        )
        .eq("student_id", userId);

      if (challengesError) {
        console.error("Error loading student challenges:", challengesError);
      } else {
        setStudentChallenges(challengesData || []);
      }

      // Load student purchases
      const { data: purchasesData, error: purchasesError } = await supabase
        .from("student_purchases")
        .select(
          `
          *,
          item:shop_items(*)
        `
        )
        .eq("student_id", userId);

      if (purchasesError) {
        console.error("Error loading student purchases:", purchasesError);
      } else {
        setStudentPurchases(purchasesData || []);
      }
    } catch (error) {
      console.error("Error loading student data:", error);
    }
  };

  const refreshStudentData = async () => {
    if (user && userProfile?.role === "student") {
      await loadStudentData(user.id);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    userData: SignUpData
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.fullName,
            role: userData.role,
            // Include all necessary data for the trigger
            grade: userData.grade,
            school: userData.school,
            state: userData.state,
            subject: userData.subject,
            experienceYears: userData.experienceYears,
          },
        },
      });

      if (error) return { error };

      // The database trigger will handle creating the profiles
      // No need to manually insert into students/teachers tables

      return { error: null };
    } catch (error) {
      console.error("Signup error:", error);
      return { error };
    }
  };

  const checkBadgeAwards = async (challengeId: string) => {
    if (!user) return;

    try {
      // Get challenge details
      const { data: challenge } = await supabase
        .from("challenges")
        .select("category")
        .eq("id", challengeId)
        .single();

      if (!challenge) return;

      // Check for category-specific badges
      const categoryBadgeMap: { [key: string]: string } = {
        conservation: "tree-hugger",
        waste: "waste-warrior",
        water: "water-guardian",
      };

      const badgeId = categoryBadgeMap[challenge.category];
      if (badgeId) {
        // Check if student already has this badge
        const hasBadge = studentBadges.some((sb) => sb.badge_id === badgeId);
        if (!hasBadge) {
          await awardBadge(badgeId);
        }
      }

      // Check for milestone badges
      const totalChallenges = studentChallenges.length + 1; // +1 for the current challenge
      if (totalChallenges === 5) {
        const hasRookie = studentBadges.some(
          (sb) => sb.badge_id === "eco-rookie"
        );
        if (!hasRookie) {
          await awardBadge("eco-rookie");
        }
      } else if (totalChallenges === 15) {
        const hasChampion = studentBadges.some(
          (sb) => sb.badge_id === "green-champion"
        );
        if (!hasChampion) {
          await awardBadge("green-champion");
        }
      }
    } catch (error) {
      console.error("Error checking badge awards:", error);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error("No user logged in") };

    const { error } = await supabase
      .from("user_profiles")
      .update(updates)
      .eq("id", user.id);

    if (!error) {
      setUserProfile((prev) => (prev ? { ...prev, ...updates } : null));
    }

    return { error };
  };

  const updateStudentProfile = async (updates: Partial<StudentProfile>) => {
    if (!user) return { error: new Error("No user logged in") };

    const { error } = await supabase
      .from("students")
      .update(updates)
      .eq("id", user.id);

    if (!error) {
      setStudentProfile((prev) => (prev ? { ...prev, ...updates } : null));
    }

    return { error };
  };

  const completeLesson = async (lessonId: string, score?: number) => {
    if (!user) return { error: new Error("No user logged in") };

    try {
      // Insert lesson completion
      const { error: lessonError } = await supabase
        .from("student_lessons")
        .insert({
          student_id: user.id,
          lesson_id: lessonId,
          score: score,
        });

      if (lessonError) return { error: lessonError };

      // Award points (25 points per lesson)
      const { error: pointsError } = await supabase
        .from("students")
        .update({
          eco_points: (studentProfile?.eco_points || 0) + 25,
          last_activity: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (pointsError) return { error: pointsError };

      // Refresh student data
      await refreshStudentData();
      await loadUserProfile(user.id);

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const completeChallenge = async (
    challengeId: string,
    evidenceUrls: string[] = []
  ) => {
    if (!user) return { error: new Error("No user logged in") };

    try {
      // Get challenge details to award points
      const { data: challenge, error: challengeError } = await supabase
        .from("challenges")
        .select("points")
        .eq("id", challengeId)
        .single();

      if (challengeError) return { error: challengeError };

      // Insert challenge completion
      const { error: completionError } = await supabase
        .from("student_challenges")
        .insert({
          student_id: user.id,
          challenge_id: challengeId,
          evidence_urls: evidenceUrls,
        });

      if (completionError) return { error: completionError };

      // Award points
      const { error: pointsError } = await supabase
        .from("students")
        .update({
          eco_points: (studentProfile?.eco_points || 0) + challenge.points,
          total_impact_score:
            (studentProfile?.total_impact_score || 0) + challenge.points * 0.1,
          last_activity: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (pointsError) return { error: pointsError };

      // Check for badge awards based on challenge completion
      await checkBadgeAwards(challengeId);

      // Refresh student data
      await refreshStudentData();
      await loadUserProfile(user.id);

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const awardBadge = async (badgeId: string) => {
    if (!user) return { error: new Error("No user logged in") };

    try {
      const { error } = await supabase.from("student_badges").insert({
        student_id: user.id,
        badge_id: badgeId,
      });

      if (!error) {
        await refreshStudentData();
      }

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const purchaseItem = async (itemId: string, price: number) => {
    if (!user) return { error: new Error("No user logged in") };
    if (!studentProfile || studentProfile.eco_points < price) {
      return { error: new Error("Insufficient points") };
    }

    try {
      // Insert purchase
      const { error: purchaseError } = await supabase
        .from("student_purchases")
        .insert({
          student_id: user.id,
          item_id: itemId,
        });

      if (purchaseError) return { error: purchaseError };

      // Deduct points
      const { error: pointsError } = await supabase
        .from("students")
        .update({
          eco_points: studentProfile.eco_points - price,
          last_activity: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (pointsError) return { error: pointsError };

      // Refresh student data
      await refreshStudentData();
      await loadUserProfile(user.id);

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const value = {
    user,
    session,
    userProfile,
    studentProfile,
    teacherProfile,
    studentBadges,
    studentLessons,
    studentChallenges,
    studentPurchases,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    updateStudentProfile,
    completeLesson,
    completeChallenge,
    awardBadge,
    purchaseItem,
    refreshStudentData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
