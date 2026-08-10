import { z } from 'zod';

export const FormSchema = z.object({
  // Step 1
  full_name: z.string().min(2, "Full name is required"),
  
  // Step 2
  gender: z.enum(['male', 'female', 'other']),
  date_of_birth: z.string().min(1, "Date of birth is required"),

  // Step 3
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  phone_number: z.string().min(10, "Phone number is too short"),
  residential_address: z.string().min(5, "Address is too short"),

  // Step 4
  institution_name: z.string().min(2, "Institution name is required"),
  course_of_study: z.string().min(2, "Course of study is required"),
  degree: z.string().min(2, "Degree is required"),
  graduation_year: z.preprocess((val) => Number(val), z.number().int().min(1900).max(2100)),

  // Step 5
  current_ac_stage: z.enum(['Final Year Student', 'Waiting for NYSC', 'Currently Serving (NYSC)', 'Completed NYSC']),

  // Step 6 (These will store URLs after upload)
  profile_picture: z.string().optional(),
  educational_cert_url: z.string().optional(),
  cv_resume_url: z.string().optional(),

  // Step 7 (Conditional)
  nysc_cert_url: z.string().optional(),
  nysc_completion_date: z.string().optional(),

  // Step 8
  skills: z.array(z.object({
    course_name: z.string(),
    platform: z.string(),
    year: z.preprocess((val) => Number(val), z.number()),
  })),

  // Step 9
  competitive_edge: z.string().min(50, "Competitive edge description is too short (min 50 characters)"),
  preferred_industry: z.string().min(1, "Preferred industry is required"),
  preferred_role: z.string().min(1, "Preferred role is required"),
  preferred_location: z.string().min(1, "Preferred location is required"),
  availability: z.string().min(1, "Availability is required"),
});

export type FormData = z.infer<typeof FormSchema>;
