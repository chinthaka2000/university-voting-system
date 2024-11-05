import React, { useState, useEffect } from 'react';
import { submitVote } from '../services/votingService';
import { useAuth } from '../contexts/AuthContext';
import { Container, Grid, Typography, Button, Card, CardContent, CardMedia, Snackbar, Paper } from '@mui/material';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, where, doc, getDoc, updateDoc, setDoc, arrayUnion } from 'firebase/firestore';
import HowToVoteIcon from '@mui/icons-material/HowToVote';

const VotingInterface: React.FC = () => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [elections, setElections] = useState<any[]>([]);
  const [selectedElection, setSelectedElection] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const { user } = useAuth();
  const [hasVoted, setHasVoted] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    if (user) {
      console.log('User UID:', user.uid); // Access the UID here
      // You can now use the UID to fetch user-specific data
    }
  }, [user]);

  useEffect(() => {
    const fetchElections = async () => {
      const electionsQuery = query(collection(db, 'elections'), where('status', '==', 'active')); // Filter for active elections
      const electionsSnapshot = await getDocs(electionsQuery);
      setElections(electionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    fetchElections();
  }, []);

  useEffect(() => {
    const fetchCandidates = async () => {
      if (selectedElection) { // Ensure selectedElection is defined
        const candidatesQuery = query(collection(db, 'candidates'), where('electionId', '==', selectedElection));
        const candidatesSnapshot = await getDocs(candidatesQuery);
        setCandidates(candidatesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    };

    fetchCandidates();
  }, [selectedElection]);

  useEffect(() => {
    const checkVotingStatus = async () => {
      if (user?.uid && selectedElection) {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const votedElections = userDoc.data().votedElections || [];
          setHasVoted(votedElections.includes(selectedElection));
        }
      }
    };

    checkVotingStatus();
  }, [user, selectedElection]);

  const handleVote = async () => {
    if (user?.uid && selectedCandidate && selectedElection) {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          await setDoc(userRef, { votedElections: [] });
        }

        if (!hasVoted) {
          await submitVote(user.uid, selectedCandidate);
          await updateDoc(userRef, { 
            votedElections: arrayUnion(selectedElection),
            hasVoted: true
          });
          setHasVoted(true);
          setSnackbarMessage('Vote submitted successfully!');
        } else {
          setSnackbarMessage('You have already voted in this election.');
        }
      } catch (error) {
        console.error('Error submitting vote:', error);
        setSnackbarMessage('Error submitting vote. Please try again.');
      }
      setSnackbarOpen(true);
    }
  };

  return (
    <Container maxWidth="lg" style={{ marginTop: '2rem' }}>
      <Paper elevation={3} style={{ padding: '2rem', marginBottom: '2rem' }}>
        <Typography variant="h4" gutterBottom>
          <HowToVoteIcon style={{ fontSize: 36, verticalAlign: 'middle', marginRight: '0.5rem' }} />
          Vote Here
        </Typography>
        <Typography variant="h6" gutterBottom>
          Select an Active Election
        </Typography>
        <Grid container spacing={3}>
          {elections.map(election => (
            <Grid item xs={12} sm={6} md={4} key={election.id}>
              <Card
                style={{
                  borderRadius: '8px',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                  border: selectedElection === election.id ? '2px solid #3f51b5' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => setSelectedElection(election.id)}
              >
                <CardContent>
                  <Typography variant="h6">{election.title}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {`Start: ${election.startDate}, End: ${election.endDate}`}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
      {selectedElection && (
        <Paper elevation={3} style={{ padding: '2rem' }}>
          <Typography variant="h6" gutterBottom>
            Select a Candidate
          </Typography>
          <Grid container spacing={3}>
            {candidates.map(candidate => (
              <Grid item xs={12} sm={6} md={4} key={candidate.id}>
                <Card
                  style={{
                    borderRadius: '8px',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                    border: selectedCandidate === candidate.id ? '2px solid #3f51b5' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => setSelectedCandidate(candidate.id)}
                >
                  <CardMedia
                    component="img"
                    alt={candidate.name}
                    height="140"
                    image={candidate.photoUrl}
                  />
                  <CardContent>
                    <Typography variant="h6">{candidate.name}</Typography>
                    <Typography variant="body2" color="textSecondary" style={{ marginBottom: '1rem' }}>
                      {candidate.party}
                    </Typography>
                    <Button
                      variant={selectedCandidate === candidate.id ? "contained" : "outlined"}
                      color={selectedCandidate === candidate.id ? "secondary" : "primary"}
                      fullWidth
                    >
                      {selectedCandidate === candidate.id ? "Selected" : "Select"}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Button
            variant="contained"
            color="primary"
            onClick={handleVote}
            disabled={!selectedCandidate || hasVoted}
            fullWidth
            style={{ marginTop: '2rem' }}
          >
            Submit Vote
          </Button>
        </Paper>
      )}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Container>
  );
};

export default VotingInterface;
