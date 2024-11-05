import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth'; // Import the method
import { auth } from '../firebase'; // Ensure you have initialized Firebase

// Define the User interface
interface User {
  uid: string;
  email: string;
  // Add other user properties as needed
}

// Define the AuthContext interface
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Create the AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the AuthProvider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((userCredential) => {
      if (userCredential) {
        setUser({
          uid: userCredential.uid,
          email: userCredential.email || '',
        });
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password); // Use the method correctly
  };

  const logout = async () => {
    await auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export AuthContext for use in other files
export { AuthContext };

export type { AuthContextType };
