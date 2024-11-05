import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, getDocs, onSnapshot } from 'firebase/firestore';
import { Typography, Grid, Paper, CircularProgress } from '@mui/material';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const ElectionStatistics: React.FC = () => {
  const [voterTurnout, setVoterTurnout] = useState<number>(0);
  const [totalVoters, setTotalVoters] = useState<number>(0);
  const [candidatePerformance, setCandidatePerformance] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStatistics = async () => {
      // Fetch total number of voters
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalVotersCount = usersSnapshot.size;
      setTotalVoters(totalVotersCount);

      // Fetch number of votes cast
      const votesSnapshot = await getDocs(collection(db, 'votes'));
      const votesCast = votesSnapshot.size;
      setVoterTurnout((votesCast / totalVotersCount) * 100);

      // Set up real-time listener for candidate performance
      const candidatesQuery = query(collection(db, 'candidates'));
      const unsubscribe = onSnapshot(candidatesQuery, (snapshot) => {
        const performanceData: any = {
          labels: [],
          datasets: [{
            label: 'Votes',
            data: [],
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
          }]
        };

        snapshot.docs.forEach((doc) => {
          const candidate = doc.data();
          performanceData.labels.push(candidate.name);
          performanceData.datasets[0].data.push(candidate.votes);
        });

        setCandidatePerformance(performanceData);
        setLoading(false);
      });

      return () => unsubscribe();
    };

    fetchStatistics();
  }, []);

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom>Election Statistics</Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper elevation={3} style={{ padding: '20px' }}>
          <Typography variant="h6">Voter Turnout</Typography>
          <Pie 
            data={{
              labels: ['Voted', 'Not Voted'],
              datasets: [{
                data: [voterTurnout, 100 - voterTurnout],
                backgroundColor: ['#4CAF50', '#F44336'],
              }]
            }}
          />
          <Typography variant="body2">Total Voters: {totalVoters}</Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper elevation={3} style={{ padding: '20px' }}>
          <Typography variant="h6">Candidate Performance</Typography>
          <Bar data={candidatePerformance} />
        </Paper>
      </Grid>
      {/* Add more grid items for additional statistics */}
    </Grid>
  );
};

export default ElectionStatistics;
