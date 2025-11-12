import { NextRequest, NextResponse } from 'next/server';
import { RecruiterAuthService } from '@/lib/recruiter-auth';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify recruiter
    const recruiterResult = await RecruiterAuthService.verifyRecruiter(token);
    if (!recruiterResult) {
      return NextResponse.json({ error: 'Not authorized as recruiter' }, { status: 403 });
    }
    
    const { search, filters, limit } = await req.json();
    
    // Get student profiles
    const students = await RecruiterAuthService.getStudentProfilesForRecruiter(
      recruiterResult.recruiter.uid,
      filters,
      limit || 20
    );
    
    // Apply search filter if provided
    let filteredStudents = students;
    if (search && search.trim()) {
      const searchLower = search.toLowerCase();
      filteredStudents = students.filter(student => 
        student.fullName?.toLowerCase().includes(searchLower) ||
        student.university?.toLowerCase().includes(searchLower) ||
        student.degree?.toLowerCase().includes(searchLower) ||
        student.city?.toLowerCase().includes(searchLower) ||
        student.country?.toLowerCase().includes(searchLower)
      );
    }
    
    return NextResponse.json({
      students: filteredStudents,
      total: filteredStudents.length,
      permissions: recruiterResult.permissions
    });
    
  } catch (error: any) {
    console.error('Get students error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

