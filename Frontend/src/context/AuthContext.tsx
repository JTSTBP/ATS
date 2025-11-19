// import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// interface User {
//   name: string;
//   email: string;
//   designation: 'Recruiter' | 'Manager' | 'HR';
// }

// interface AuthContextType {
//   user: User | null;
//   login: (email: string, password: string, designation: User['designation']) => boolean;
//   logout: () => void;
//   isAuthenticated: boolean;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export function AuthProvider({ children }: { children: ReactNode }) {
//   const [user, setUser] = useState<User | null>(null);

//   useEffect(() => {
//     const storedUser = localStorage.getItem('ats_user');
//     if (storedUser) {
//       setUser(JSON.parse(storedUser));
//     }
//   }, []);

//   const login = (email: string, password: string, designation: User['designation']) => {
//     if (password.length >= 6) {
//       const userName = email.split('@')[0].split('.').map(
//         word => word.charAt(0).toUpperCase() + word.slice(1)
//       ).join(' ');

//       const newUser: User = {
//         name: userName,
//         email,
//         designation,
//       };

//       setUser(newUser);
//       localStorage.setItem('ats_user', JSON.stringify(newUser));
//       return true;
//     }
//     return false;
//   };

//   const logout = () => {
//     setUser(null);
//     localStorage.removeItem('ats_user');
//   };

//   return (
//     <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// }

