import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ThemeProvider, 
  CssBaseline, 
  Container, 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Card, 
  CardContent,
  Chip,
  Paper,
  LinearProgress,
  Fade,
  Slide,
  IconButton,
  Divider,
  Alert,
  AlertTitle,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { 
  Search as SearchIcon,
  Security as SecurityIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Speed as SpeedIcon,
  Analytics as AnalyticsIcon,
  History as HistoryIcon,
  Clear as ClearIcon,
  Visibility as VisibilityIcon,
  Help as HelpIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  PictureAsPdf as PictureAsPdfIcon,
  
} from '@mui/icons-material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lightTheme, darkTheme } from './themes';
import { SecureTraceNav, PageWrapper } from './components/SecureTraceNav';
import { BitScanAPI } from './services/api';
import type { AnalysisResponse } from './types/api';
import { downloadPdfReportWithCharts } from './utils/reportGenerator';
import WalletCredibilityChart from './components/WalletCredibilityChart';
import InflowOutflowChart from './components/InflowOutflowChart';

// Create a query client
const queryClient = new QueryClient();

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [address, setAddress] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [scanHistory, setScanHistory] = useState<AnalysisResponse[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<number | false>(false);
  const [error, setError] = useState<string | null>(null);
  const faqContainerRef = useRef<HTMLDivElement>(null);
  const lastExpandedRef = useRef<number | null>(null);
  const [showApproach, setShowApproach] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const isEmptyWallet = useMemo(() => {
    if (!analysis || !analysis.analysis_summary) return false;
    const summary = analysis.analysis_summary;
    return summary.transaction_count === 0 &&
      summary.total_received_btc === 0 &&
      summary.total_sent_btc === 0;
  }, [analysis]);

  useEffect(() => {
    if (isEmptyWallet) {
      setShowCharts(false);
    }
  }, [isEmptyWallet]);

  // Handle FAQ auto-scroll when accordion expands
  useEffect(() => {
    if (expandedFAQ !== false && expandedFAQ !== lastExpandedRef.current && faqContainerRef.current) {
      // Small delay to ensure the content has expanded
      setTimeout(() => {
        if (faqContainerRef.current) {
          const container = faqContainerRef.current;
          const expandedElement = document.getElementById(`faq-item-${expandedFAQ}`);
          if (expandedElement) {
            const containerRect = container.getBoundingClientRect();
            const elementRect = expandedElement.getBoundingClientRect();
            
            // Calculate the position to scroll to
            const scrollTop = elementRect.top - containerRect.top + container.scrollTop;
            container.scrollTo({
              top: scrollTop,
              behavior: 'smooth'
            });
          }
        }
      }, 300);
      
      lastExpandedRef.current = expandedFAQ;
    }
  }, [expandedFAQ]);

  // Load scan history from localStorage on component mount
  React.useEffect(() => {
    const savedHistory = localStorage.getItem('bitscan_history');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        setScanHistory(parsedHistory);
      } catch (error) {
        console.error('Error loading scan history:', error);
        localStorage.removeItem('bitscan_history');
      }
    }
  }, []);

  // Save scan history to localStorage whenever it changes
  const saveToHistory = (analysisResult: AnalysisResponse) => {
    const newHistory = [analysisResult, ...scanHistory.filter(item => item.address !== analysisResult.address)].slice(0, 10); // Keep only last 10 scans
    setScanHistory(newHistory);
    localStorage.setItem('bitscan_history', JSON.stringify(newHistory));
  };

  // Clear scan history
  const clearHistory = () => {
    setScanHistory([]);
    localStorage.removeItem('bitscan_history');
  };

  const handleAnalyze = async () => {
    if (!address) return;
    try {
      setLoading(true);
      setShowResults(false);
      setError(null);
      const result = await BitScanAPI.analyzeAddress(address);
      setAnalysis(result);
      saveToHistory(result); // Save to history
      setTimeout(() => setShowResults(true), 500); // Delayed animation
    } catch (error) {
      console.error('Analysis failed:', error);
      setError(error instanceof Error ? error.message : 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    const colors = {
      'MINIMAL': '#4caf50',
      'LOW': '#2196f3', 
      'MEDIUM': '#ff9800',
      'HIGH': '#f44336',
      'CRITICAL': '#d32f2f',
      'UNKNOWN': '#757575'
    };
    return colors[riskLevel as keyof typeof colors] || colors['UNKNOWN'];
  };

  const getRiskIcon = (riskLevel: string) => {
    if (['MINIMAL', 'LOW'].includes(riskLevel)) return <CheckCircleIcon />;
    if (['MEDIUM'].includes(riskLevel)) return <WarningIcon />;
    return <SecurityIcon />;
  };

  return (
    <QueryClientProvider client={queryClient}>
<ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
  <CssBaseline />
  <PageWrapper>
          <SecureTraceNav
            isDarkMode={isDarkMode}
            onToggleTheme={() => setIsDarkMode((prev) => !prev)}
            onShowHowWeWork={() => setShowApproach(true)}
            onShowFAQ={() => setShowFAQ(true)}
            onShowHistory={() => setShowHistory(true)}
          />

          <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 }, position: 'relative' }}>
            {/* BitScan hero */}
            <Fade in timeout={1000}>
              <Box component="section" id="overview" sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: { xs: 'flex-start', md: 'center' },
                justifyContent: 'space-between',
                gap: { xs: 6, md: 8 },
                mb: { xs: 6, md: 8 }
              }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box>
                    <Typography
                      variant="overline"
                      sx={{
                        letterSpacing: '0.44em',
                        textTransform: 'uppercase',
                        color: isDarkMode ? 'rgba(226, 232, 240, 0.75)' : 'rgba(15, 23, 42, 0.65)',
                        fontWeight: 600,
                        display: 'block',
                        mb: 1
                      }}
                    >
                      BitScan
                    </Typography>
                    <Typography
                      variant="h2"
                      component="h1"
                      sx={{
                        fontSize: { xs: '1.75rem', sm: '2.2rem', md: '3.5rem' },
                        fontWeight: 700,
                        lineHeight: { xs: 1.2, md: 1.08 },
                        background: 'linear-gradient(120deg, #60a5fa 0%, #38bdf8 60%, #22d3ee 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}
                    >
                      BTC Fraud Detection & Exposure Analytics
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        mt: 2,
                        maxWidth: 520,
                        color: isDarkMode ? 'rgba(203, 213, 225, 0.75)' : 'rgba(30, 41, 59, 0.72)',
                        fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1.05rem' },
                        lineHeight: 1.7
                      }}
                    >
                      BitScan pinpoints suspicious BTC flows, aggregates exposure histories, and prioritises alerts so compliance teams can neutralise fraud activity in minutes.
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ flex: 1 }} />
              </Box>
            </Fade>

            {/* System Capabilities Cards */}
            <Slide in timeout={1200}>
              <Box component="section" id="capabilities" sx={{ mb: 6 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
                  {[
                    { icon: <AnalyticsIcon />, label: 'Real-Time Analysis', value: 'Live API', color: '#059669', description: 'Blockchain data' },
                    { icon: <SpeedIcon />, label: 'Risk Assessment', value: 'Multi-layer', color: '#dc2626', description: 'Pattern analysis' },
                    { icon: <TrendingUpIcon />, label: 'Network Coverage', value: 'Bitcoin', color: '#7c3aed', description: 'Mainnet & Testnet' }
                  ].map((stat, index) => (
                    <Paper
                      key={index}
                      sx={{
                        p: { xs: 2, md: 3 },
                        minWidth: { xs: 140, sm: 160, md: 180 },
                        flex: { xs: '1 1 calc(33.333% - 16px)', sm: '0 1 auto' },
                        textAlign: 'center',
                        background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(10px)',
                        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                        borderRadius: '12px',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: `0 8px 25px ${stat.color}20`
                        }
                      }}
                    >
                      <Box sx={{ color: stat.color, mb: 1.5 }}>{stat.icon}</Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: stat.color }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary', fontSize: '0.85rem', mb: 0.5 }}>
                        {stat.label}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', opacity: 0.7 }}>
                        {stat.description}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              </Box>
            </Slide>

            <Box
              component="section"
              id="reports"
              sx={{
                mb: 6,
                px: { xs: 2, md: 4 },
                py: { xs: 4, md: 6 },
                borderRadius: 24,
                background: isDarkMode ? 'rgba(15, 23, 42, 0.4)' : 'rgba(241, 245, 249, 0.6)',
                border: isDarkMode ? '1px solid rgba(96, 165, 250, 0.2)' : '1px solid rgba(148, 163, 184, 0.2)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 1.5, fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
                Reports & Evidence Packs
              </Typography>
              <Typography variant="body1" sx={{ maxWidth: 720, fontSize: { xs: '0.9rem', md: '1rem' }, color: isDarkMode ? 'rgba(226, 232, 240, 0.78)' : 'rgba(30, 41, 59, 0.7)' }}>
                Export BitScan assessments with charts, counterparties, and timeline evidence in one click. Use this section to trigger PDF generation, shareable links, or integrate with your workflow tools.
              </Typography>
            </Box>

            {/* Scan History Section - Converted to Modal */}
            {showHistory && (
              <Fade in={showHistory} timeout={800}>
                <Box sx={{ 
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(8px)',
                  zIndex: 1000,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  p: 2,
                  pt: { xs: 11, md: 13 }
                }}>
                  <Card sx={{ 
                    maxWidth: 800,
                    maxHeight: '90vh',
                    width: '100%',
                    background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(25px)',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: { xs: '16px', md: '25px' },
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
                    overflow: 'auto'
                  }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 }, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 2, md: 3 }, flexWrap: 'wrap', gap: 1 }}>
                        <Typography variant="h5" sx={{ fontWeight: 600, fontSize: { xs: '1.25rem', md: '1.5rem' }, fontFamily: '"Inter", "Roboto", sans-serif' }}>
                          <HistoryIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: { xs: '1.25rem', md: 'inherit' } }} />
                          Scan History ({scanHistory.length}/10)
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {scanHistory.length > 0 && (
                            <Button
                              onClick={clearHistory}
                              startIcon={<ClearIcon sx={{ display: { xs: 'none', sm: 'block' } }} />}
                              sx={{
                                color: '#ef4444',
                                borderColor: '#ef4444',
                                fontSize: { xs: '0.8rem', md: '0.875rem' },
                                px: { xs: 1.5, md: 2 },
                                '&:hover': {
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  borderColor: '#dc2626'
                                }
                              }}
                              variant="outlined"
                            >
                              {window.innerWidth < 600 ? 'Clear' : 'Clear History'}
                            </Button>
                          )}
                          <IconButton
                            onClick={() => setShowHistory(false)}
                            sx={{
                              color: 'text.secondary',
                              '&:hover': {
                                background: 'rgba(0, 0, 0, 0.1)',
                                transform: 'scale(1.1)'
                              }
                            }}
                          >
                            <CloseIcon />
                          </IconButton>
                        </Box>
                      </Box>
                      
                      <Box sx={{ flex: 1, overflowY: 'auto', pr: 1, '&::-webkit-scrollbar': { width: '8px' }, '&::-webkit-scrollbar-track': { background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)', borderRadius: '4px' }, '&::-webkit-scrollbar-thumb': { background: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.12)', borderRadius: '4px', '&:hover': { background: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)' } } }}>
                        {scanHistory.length === 0 ? (
                          <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="body1" color="text.secondary">
                              No scan history yet. Analyze a Bitcoin address to see it here!
                            </Typography>
                          </Box>
                        ) : (
                          <Box>
                            {scanHistory.map((historyItem, index) => (
                              <Paper
                                key={`${historyItem.address}-${index}`}
                                sx={{
                                  p: 3,
                                  mb: 2,
                                  background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.9)',
                                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                                  borderRadius: '12px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
                                  }
                                }}
                                onClick={() => {
                                  setAddress(historyItem.address);
                                  setAnalysis(historyItem);
                                  setShowResults(true);
                                  setShowHistory(false);
                                }}
                              >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                      {`${historyItem.address.substring(0, 12)}...${historyItem.address.slice(-8)}`}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                      <Chip
                                        size="small"
                                        label={`${historyItem.risk_level} RISK`}
                                        sx={{
                                          background: `${getRiskColor(historyItem.risk_level)}20`,
                                          color: getRiskColor(historyItem.risk_level),
                                          border: `1px solid ${getRiskColor(historyItem.risk_level)}`,
                                          fontWeight: 600,
                                          fontSize: '0.75rem'
                                        }}
                                      />
                                      <Typography variant="caption" color="text.secondary">
                                        {(historyItem.risk_score * 100).toFixed(1)}% Risk Score
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {historyItem.analysis_summary.current_balance_btc.toFixed(8)} BTC
                                      </Typography>
                                    </Box>
                                  </Box>
                                  <VisibilityIcon sx={{ color: 'text.secondary' }} />
                                </Box>
                              </Paper>
                            ))}
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              </Fade>
            )}

            {/* Approach Modal */}
            {showApproach && (
              <Fade in={showApproach} timeout={800}>
                <Box sx={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(8px)',
                  zIndex: 1000,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  p: 2,
                  pt: { xs: 11, md: 13 }
                }}>
                  <Card sx={{
                    maxWidth: 900,
                    maxHeight: '90vh',
                    width: '100%',
                    background: isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)',
                    backdropFilter: 'blur(25px)',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: { xs: '16px', md: '25px' },
                    boxShadow: isDarkMode ? '0 25px 50px rgba(0, 0, 0, 0.5)' : '0 25px 50px rgba(0, 0, 0, 0.15)',
                    overflow: 'auto'
                  }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 }, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 2, md: 3 } }}>
                        <Typography variant="h5" sx={{ fontWeight: 600, fontSize: { xs: '1.25rem', md: '1.5rem' }, fontFamily: '"Inter", "Roboto", sans-serif' }}>
                          <AnalyticsIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: { xs: '1.25rem', md: 'inherit' } }} />
                          How we analyze Bitcoin wallets (Our approach)
                        </Typography>
                        <IconButton
                          onClick={() => setShowApproach(false)}
                          sx={{
                            color: 'text.primary',
                            background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                            '&:hover': { 
                              background: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)', 
                              transform: 'scale(1.1)' 
                            }
                          }}
                        >
                          <CloseIcon />
                        </IconButton>
                      </Box>
                      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', pr: 1, '&::-webkit-scrollbar': { width: '8px' }, '&::-webkit-scrollbar-track': { background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)', borderRadius: '4px' }, '&::-webkit-scrollbar-thumb': { background: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.12)', borderRadius: '4px', '&:hover': { background: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)' } } }}>
                        {[
                          '• Data Collection: We aggregate data from multiple sources including Elliptic, BitcoinHeist, Cryptocurrency Scam DB, BABD-13, and our own curated dataset of suspicious wallets, combined with real-time blockchain data.',
                          '• Feature Extraction: Our system extracts 20+ specialized features including core transaction metrics, ratio features (in/out value ratios), address characteristics, temporal patterns, network topology metrics, and statistical indicators.',
                          '• Ensemble Machine Learning: We employ an advanced ensemble of models including Gradient Boosting, Neural Networks, Extra Trees, and Isolation Forest algorithms that work together to detect anomalous patterns.',
                          '• Blockchain Analysis: Our BlockchainAnalyzer examines transaction patterns, identifies suspicious behaviors like peel chains and mixers, and maps relationships between addresses to detect fraud networks.',
                          '• Advanced Risk Scoring: The risk scoring engine combines ML model predictions, blockchain behavior analysis, external data sources, behavioral patterns, and network topology with configurable weights to calculate a comprehensive risk score.',
                          '• Risk Classification: Addresses are classified into risk levels (MINIMAL/LOW/MEDIUM/HIGH/CRITICAL) based on their risk scores, with configurable thresholds to balance sensitivity.',
                          '• Confidence Calculation: We report confidence levels based on data completeness, model agreement, historical accuracy on similar patterns, and the presence of definitive fraud signals.',
                          '• Real-time Validation: We query live blockchain data to verify current address status, recent transactions, and counterparty risk to ensure up-to-date analysis.',
                          '• Continuous Improvement: Our models are regularly retrained on new data, with performance tracked via F1 score, ROC-AUC, and other metrics to minimize false positives/negatives.'
                        ].map((line, idx) => (
                          <Typography key={idx} variant="body1" sx={{ mb: 1, fontSize: { xs: '0.875rem', md: '1rem' }, fontFamily: '"Inter", "Roboto", sans-serif', lineHeight: 1.6 }}>
                            {line}
                          </Typography>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              </Fade>
            )}

            {/* Analysis Form */}
            <Slide in timeout={1400}>
              <Card sx={{ 
                mb: { xs: 3, md: 4 }, 
                background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(25px)',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: { xs: '16px', md: '25px' },
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                transition: 'all 0.4s ease',
                '&:hover': {
                  transform: 'translateY(-10px)',
                  boxShadow: '0 35px 70px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                }
              }}>
                <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                  <Typography variant="h4" gutterBottom sx={{ 
                    textAlign: 'center', 
                    mb: { xs: 3, md: 4 },
                    fontWeight: 600,
                    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
                    color: 'text.primary',
                    fontFamily: '"Inter", "Roboto", sans-serif'
                  }}>
                    Bitcoin Address Analysis
                  </Typography>
                  
                  <Box sx={{ maxWidth: 700, mx: 'auto' }}>
                    <Box sx={{ display: 'flex', gap: { xs: 2, md: 3 }, mb: { xs: 3, md: 4 }, flexDirection: { xs: 'column', sm: 'row' } }}>
                      <TextField
                        fullWidth
                        label="Bitcoin Address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '20px',
                            background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(15px)',
                            border: '2px solid transparent',
                            backgroundClip: 'padding-box',
                            transition: 'all 0.3s ease',
                            fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                            '&:hover': {
                              background: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 1)',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 10px 30px rgba(102, 126, 234, 0.2)'
                            },
                            '&.Mui-focused': {
                              background: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 1)',
                              boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.3)',
                              transform: 'translateY(-2px)'
                            },
                            '& fieldset': { border: 'none' }
                          },
                          '& .MuiInputLabel-root': {
                            fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                            fontWeight: 500
                          }
                        }}
                      />
                      <Button
                        variant="contained"
                        onClick={handleAnalyze}
                        disabled={loading || !address}
                        startIcon={loading ? null : <SearchIcon />}
                        sx={{
                          minWidth: { xs: '100%', sm: 140, md: 160 },
                          height: { xs: 50, md: 60 },
                          borderRadius: '20px',
                          background: 'linear-gradient(45deg, #2563eb 0%, #0891b2 50%, #06b6d4 100%)',
                          boxShadow: '0 8px 25px rgba(37, 99, 235, 0.4)',
                          fontSize: { xs: '0.95rem', md: '1.1rem' },
                          fontWeight: 700,
                          textTransform: 'none',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #0891b2 0%, #06b6d4 50%, #2563eb 100%)',
                            transform: 'translateY(-3px)',
                            boxShadow: '0 12px 35px rgba(37, 99, 235, 0.6)'
                          },
                          '&:disabled': {
                            background: 'rgba(0, 0, 0, 0.12)',
                            transform: 'none',
                            boxShadow: 'none'
                          },
                          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                        }}
                      >
                        {loading ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 20,
                                height: 20,
                                border: '2px solid rgba(255,255,255,0.3)',
                                borderTop: '2px solid white',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                '@keyframes spin': {
                                  '0%': { transform: 'rotate(0deg)' },
                                  '100%': { transform: 'rotate(360deg)' }
                                }
                              }}
                            />
                            Analyzing...
                          </Box>
                        ) : (
                          'Analyze'
                        )}
                      </Button>
                    </Box>
                    
                    {loading && (
                      <Box sx={{ mb: 4 }}>
                        <Box sx={{ 
                          background: 'linear-gradient(90deg, #2563eb 0%, #0891b2 50%, #06b6d4 100%)',
                          borderRadius: '4px',
                          height: 4,
                          overflow: 'hidden',
                          position: 'relative'
                        }}>
                          <Box sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            height: '100%',
                            width: '30%',
                            background: 'rgba(255, 255, 255, 0.4)',
                            borderRadius: '4px',
                            animation: 'slide 2s ease-in-out infinite',
                            '@keyframes slide': {
                              '0%': { transform: 'translateX(-100%)' },
                              '100%': { transform: 'translateX(350%)' }
                            }
                          }} />
                        </Box>
                        <Typography variant="body2" sx={{ textAlign: 'center', mt: 2, fontStyle: 'italic', opacity: 0.7, fontFamily: '"Inter", "Roboto", sans-serif' }}>
                          Analyzing blockchain data and risk patterns...
                        </Typography>
                      </Box>
                    )}
                    
                    {/* Professional Sample Addresses */}
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="subtitle1" sx={{ 
                        mb: 3,
                        color: 'text.secondary',
                        fontWeight: 500,
                        fontFamily: '"Inter", "Roboto", sans-serif'
                      }}>
                        Sample addresses for testing:
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        gap: 2, 
                        flexWrap: 'wrap', 
                        justifyContent: 'center',
                        '& .MuiChip-root': {
                          transition: 'all 0.2s ease-in-out'
                        }
                      }}>
                        {[
                          { addr: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', label: 'Genesis Block', color: '#2563eb' },
                          { addr: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2', label: 'Standard Address', color: '#0891b2' },
                          { addr: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', label: 'SegWit Address', color: '#06b6d4' }
                        ].map((sample, index) => (
                          <Chip
                            key={index}
                            label={sample.label}
                            onClick={() => setAddress(sample.addr)}
                            variant={address === sample.addr ? 'filled' : 'outlined'}
                            sx={{
                              px: 2,
                              py: 0.5,
                              fontSize: '0.9rem',
                              fontWeight: 500,
                              borderRadius: '8px',
                              border: `1.5px solid ${sample.color}`,
                              color: address === sample.addr ? 'white' : 'text.primary',
                              background: address === sample.addr 
                                ? sample.color
                                : 'transparent',
                              backdropFilter: 'blur(10px)',
                              fontFamily: '"Inter", "Roboto", sans-serif',
                              '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: `0 4px 12px ${sample.color}30`,
                                background: address === sample.addr 
                                  ? sample.color 
                                  : `${sample.color}15`
                              }
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Slide>

            {/* Error Display */}
            {error && (
              <Fade in timeout={500}>
                <Alert 
                  severity="error" 
                  onClose={() => setError(null)}
                  sx={{ 
                    mb: 4,
                    borderRadius: '12px',
                    '& .MuiAlert-message': {
                      fontFamily: '"Inter", "Roboto", sans-serif'
                    }
                  }}
                >
                  {error}
                </Alert>
              </Fade>
            )}

            {/* Enhanced Results */}
            {analysis && (
              <Fade in={showResults} timeout={1000}>
                <Card sx={{ 
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(25px)',
                  border: isDarkMode ? '2px solid rgba(255, 255, 255, 0.2)' : '2px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '25px',
                  boxShadow: isDarkMode 
                    ? '0 30px 60px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    : '0 30px 60px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(0, 0, 0, 0.05)',
                  overflow: 'hidden',
                  position: 'relative',
                  mb: 4,
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(90deg, #2563eb 0%, #0891b2 50%, #06b6d4 100%)'
                  }
                }}>
                  <CardContent sx={{ p: 5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                      <Typography variant="h4" sx={{ fontWeight: 600, fontFamily: '"Inter", "Roboto", sans-serif' }}>
                        Analysis Results
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Chip
                          icon={isEmptyWallet ? <HistoryIcon /> : getRiskIcon(analysis.risk_level)}
                          label={isEmptyWallet ? 'NO ON-CHAIN ACTIVITY' : `${analysis.risk_level} RISK`}
                          sx={{
                            background: `${(isEmptyWallet ? '#64748b' : getRiskColor(analysis.risk_level))}20`,
                            color: isEmptyWallet ? '#64748b' : getRiskColor(analysis.risk_level),
                            border: `1px solid ${isEmptyWallet ? '#64748b' : getRiskColor(analysis.risk_level)}`,
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            py: 2,
                            fontFamily: '"Inter", "Roboto", sans-serif'
                          }}
                        />
                        {!isEmptyWallet && (
                          <Button
                            variant="outlined"
                            onClick={() => setShowCharts(!showCharts)}
                            sx={{
                              borderRadius: '10px',
                              textTransform: 'none',
                              fontWeight: 600
                            }}
                          >
                            {showCharts ? 'Hide Charts' : 'Show Charts'}
                          </Button>
                        )}
                      </Box>
                    </Box>
                    
                    <Divider sx={{ mb: 4 }} />

                    {!isEmptyWallet && (
                      <Box sx={{ 
                        display: showCharts || generatingPdf ? 'block' : 'none',
                        position: generatingPdf && !showCharts ? 'absolute' : 'relative',
                        left: generatingPdf && !showCharts ? '-9999px' : 'auto',
                        top: generatingPdf && !showCharts ? '0' : 'auto'
                      }}>
                        {(showCharts || generatingPdf) && (
                        <>
                          <Box sx={{ mb: 4 }} data-chart="balance-history">
                            <WalletCredibilityChart
                              address={analysis.address}
                              defaultDays={90}
                              defaultGranularity="day"
                              dark={isDarkMode}
                            />
                          </Box>
                          
                          <Box sx={{ mb: 4 }} data-chart="inflow-outflow">
                            <InflowOutflowChart
                              address={analysis.address}
                              defaultDays={90}
                              defaultGranularity="week"
                              dark={isDarkMode}
                            />
                          </Box>
                        </>
                      )}
                      </Box>
                    )}
                    
                    {!isEmptyWallet && (
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" gutterBottom>
                          Risk Score: {(analysis.risk_score * 100).toFixed(1)}%
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={analysis.risk_score * 100}
                          sx={{ 
                            height: 12,
                            borderRadius: 2,
                            background: 'rgba(0, 0, 0, 0.1)',
                            '& .MuiLinearProgress-bar': {
                              background: `linear-gradient(45deg, ${getRiskColor(analysis.risk_level)} 30%, ${getRiskColor(analysis.risk_level)}80 90%)`,
                              borderRadius: 2
                            }
                          }}
                        />
                      </Box>
                    )}

                    {/* Detailed Risk Analysis Explanation */}
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, fontFamily: '"Inter", "Roboto", sans-serif' }}>
                        Analysis Details
                      </Typography>
                      <Paper sx={{
                        p: 3,
                        background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.9)',
                        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                        borderRadius: '12px',
                        borderLeft: `4px solid ${isEmptyWallet ? '#94a3b8' : getRiskColor(analysis.risk_level)}`
                      }}>
                        {isEmptyWallet ? (
                          <Alert
                            severity="info"
                            sx={{
                              borderRadius: '12px',
                              '& .MuiAlert-message': {
                                fontFamily: '"Inter", "Roboto", sans-serif'
                              }
                            }}
                          >
                            <AlertTitle>No On-Chain Activity Detected</AlertTitle>
                            This wallet has no recorded transactions. Risk models require on-chain activity, so all factors are marked as not available.
                            Monitor the address for future activity or analyze another wallet for a comprehensive breakdown.
                          </Alert>
                        ) : (analysis.risk_level === 'MINIMAL' || analysis.risk_level === 'VERY_LOW') ? (
                          <Box>
                            <Typography variant="h6" sx={{ color: '#059669', mb: 2, fontWeight: 600 }}>
                              Legitimate Address Indicators
                            </Typography>
                            <List dense>
                              {analysis.positive_indicators && analysis.positive_indicators.length > 0 ? (
                                analysis.positive_indicators.map((indicator, index) => (
                                  <ListItem key={index}>
                                    <ListItemIcon><CheckCircleIcon sx={{ color: '#059669', fontSize: 20 }} /></ListItemIcon>
                                    <ListItemText primary={indicator} />
                                  </ListItem>
                                ))
                              ) : (
                                <>
                                  <ListItem>
                                    <ListItemIcon><CheckCircleIcon sx={{ color: '#059669', fontSize: 20 }} /></ListItemIcon>
                                    <ListItemText 
                                      primary="Normal Transaction Patterns" 
                                      secondary="Regular transaction frequency and amounts within expected ranges"
                                    />
                                  </ListItem>
                                  <ListItem>
                                    <ListItemIcon><CheckCircleIcon sx={{ color: '#059669', fontSize: 20 }} /></ListItemIcon>
                                    <ListItemText 
                                      primary="No Fraud Database Matches" 
                                      secondary="Address not found in known scam, ransomware, or suspicious wallet databases"
                                    />
                                  </ListItem>
                                  <ListItem>
                                    <ListItemIcon><CheckCircleIcon sx={{ color: '#059669', fontSize: 20 }} /></ListItemIcon>
                                    <ListItemText 
                                      primary="Healthy Network Connections" 
                                      secondary="Transactions with reputable exchanges and legitimate services"
                                    />
                                  </ListItem>
                                  {analysis.analysis_summary?.transaction_count > 10 && (
                                    <ListItem>
                                      <ListItemIcon><CheckCircleIcon sx={{ color: '#059669', fontSize: 20 }} /></ListItemIcon>
                                      <ListItemText 
                                        primary="Established Transaction History" 
                                        secondary={`${analysis.analysis_summary?.transaction_count} transactions show consistent, legitimate usage patterns`}
                                      />
                                    </ListItem>
                                  )}
                                  {analysis.analysis_summary?.current_balance_btc > 0 && (
                                    <ListItem>
                                      <ListItemIcon><CheckCircleIcon sx={{ color: '#059669', fontSize: 20 }} /></ListItemIcon>
                                      <ListItemText 
                                        primary="Active Wallet Status" 
                                        secondary={`Maintains balance of ${(analysis.analysis_summary?.current_balance_btc || 0).toFixed(8)} BTC indicating active, legitimate use`}
                                      />
                                    </ListItem>
                                  )}
                                </>
                              )}
                            </List>
                          </Box>
                        ) : (
                          <Box>
                            <Typography variant="h6" sx={{ 
                              color: analysis.risk_level === 'HIGH' || analysis.risk_level === 'CRITICAL' ? '#dc2626' : '#f59e0b', 
                              mb: 2, 
                              fontWeight: 600 
                            }}>
                              Risk Factors Detected
                            </Typography>
                            <List dense>
                              {analysis.risk_factors && analysis.risk_factors.length > 0 ? (
                                analysis.risk_factors.map((factor, index) => (
                                  <ListItem key={index}>
                                    <ListItemIcon>
                                      <WarningIcon sx={{ 
                                        color: analysis.risk_level === 'HIGH' || analysis.risk_level === 'CRITICAL' ? '#dc2626' : '#f59e0b', 
                                        fontSize: 20 
                                      }} />
                                    </ListItemIcon>
                                    <ListItemText primary={factor} />
                                  </ListItem>
                                ))
                              ) : (
                                // Only show generic factors if no specific factors are provided AND risk is high/critical
                                (analysis.risk_level === 'HIGH' || analysis.risk_level === 'CRITICAL') ? (
                                  <>
                                    <ListItem>
                                      <ListItemIcon><WarningIcon sx={{ color: '#dc2626', fontSize: 20 }} /></ListItemIcon>
                                      <ListItemText 
                                        primary="Potential Fraud Database Match" 
                                        secondary="Address or related addresses found in cryptocurrency scam databases"
                                      />
                                    </ListItem>
                                    <ListItem>
                                      <ListItemIcon><WarningIcon sx={{ color: '#dc2626', fontSize: 20 }} /></ListItemIcon>
                                      <ListItemText 
                                        primary="Suspicious Transaction Patterns" 
                                        secondary="Rapid fund movements, unusual amounts, or timing consistent with fraudulent activities"
                                      />
                                    </ListItem>
                                    <ListItem>
                                      <ListItemIcon><WarningIcon sx={{ color: '#dc2626', fontSize: 20 }} /></ListItemIcon>
                                      <ListItemText 
                                        primary="High-Risk Network Connections" 
                                        secondary="Transactions with known mixing services, darknet markets, or flagged addresses"
                                      />
                                    </ListItem>
                                    {analysis.analysis_summary?.transaction_count < 5 && (
                                      <ListItem>
                                        <ListItemIcon><WarningIcon sx={{ color: '#dc2626', fontSize: 20 }} /></ListItemIcon>
                                        <ListItemText 
                                          primary="Limited Transaction History" 
                                          secondary="Few transactions may indicate a temporary or throwaway wallet commonly used in scams"
                                        />
                                      </ListItem>
                                    )}
                                  </>
                                ) : (
                                  // For MEDIUM/LOW risk, show a more appropriate message
                                  <>
                                    <ListItem>
                                      <ListItemIcon><WarningIcon sx={{ color: '#f59e0b', fontSize: 20 }} /></ListItemIcon>
                                      <ListItemText 
                                        primary="Minor Deviations Detected" 
                                        secondary="Some transaction patterns show slight deviations from typical behavior, but overall risk remains low"
                                      />
                                    </ListItem>
                                    <ListItem>
                                      <ListItemIcon><CheckCircleIcon sx={{ color: '#059669', fontSize: 20 }} /></ListItemIcon>
                                      <ListItemText 
                                        primary="No Significant Risk Factors" 
                                        secondary="No major red flags detected, most patterns are consistent with legitimate usage"
                                      />
                                    </ListItem>
                                  </>
                                )
                              )}
                            </List>
                          </Box>
                        )}

                        {!isEmptyWallet && (
                          <>
                            <Divider sx={{ my: 2 }} />
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                Confidence Level: {(analysis.confidence * 100).toFixed(1)}%
                              </Typography>
                              <Chip 
                                size="small" 
                                label={
                                  analysis.confidence > 0.8 
                                    ? 'High Confidence' 
                                    : analysis.confidence > 0.5 
                                      ? 'Medium Confidence' 
                                      : 'Low Confidence'
                                }
                                color={
                                  analysis.confidence > 0.8 
                                    ? 'success' 
                                    : analysis.confidence > 0.5 
                                      ? 'warning' 
                                      : 'error'
                                }
                                variant="outlined"
                              />
                            </Box>
                          </>
                        )}

                        {/* Data Limitations Warning */}
                        {analysis.data_limitations && (
                          <Alert 
                            severity="warning" 
                            sx={{ 
                              mt: 2,
                              borderRadius: '12px',
                              '& .MuiAlert-message': {
                                fontFamily: '"Inter", "Roboto", sans-serif'
                              }
                            }}
                          >
                            <AlertTitle>Data Limitations</AlertTitle>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              {analysis.data_limitations.description || analysis.data_limitations.note || 'Analysis may have limitations due to data availability or API constraints.'}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>Accuracy:</strong> {analysis.data_limitations.accuracy_note || 'Data quality may vary based on API availability.'}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Recommendation:</strong> {analysis.data_limitations.recommendation || 'For best results, try again later when API limits are reset.'}
                            </Typography>
                          </Alert>
                        )}

                        {/* Download Report Buttons */}
                        <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'center' }}>
                          <Button
                            variant="contained"
                            disabled={generatingPdf || isEmptyWallet}
                            onClick={async () => {
                              if (isEmptyWallet) {
                                return;
                              }
                              const chartsWereHidden = !showCharts;
                              setGeneratingPdf(true);

                              try {
                                // Temporarily show charts for PDF capture
                                if (chartsWereHidden) {
                                  setShowCharts(true);
                                  // Wait 5 seconds for charts to fully load and render with data
                                  await new Promise(resolve => setTimeout(resolve, 5000));
                                } else {
                                  // Even if charts are visible, wait to ensure they're fully rendered
                                  await new Promise(resolve => setTimeout(resolve, 2000));
                                }

                                await downloadPdfReportWithCharts(analysis, address);
                              } finally {
                                // Always hide charts after PDF generation if they were hidden before
                                if (chartsWereHidden) {
                                  // Immediate hide after PDF generation
                                  setShowCharts(false);
                                }
                                setGeneratingPdf(false);
                              }
                            }}
                            sx={{
                              background: 'linear-gradient(45deg, #2563eb 0%, #0891b2 50%, #06b6d4 100%)',
                              borderRadius: '12px',
                              px: 3,
                              py: 1.5,
                              fontWeight: 600,
                              '&:hover': {
                                background: 'linear-gradient(45deg, #0891b2 0%, #06b6d4 50%, #2563eb 100%)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 8px 25px rgba(37, 99, 235, 0.4)'
                              }
                            }}
                          >
                            <PictureAsPdfIcon sx={{ mr: 1 }} />
                            {generatingPdf ? 'Generating PDF...' : 'Download PDF Report'}
                          </Button>
                        </Box>
                      </Paper>
                    </Box>

                    {/* Professional Metrics Grid */}
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
                      gap: 3, 
                      mb: 4 
                    }}>
                      {[
                        { label: 'Address', value: `${analysis.address.substring(0, 12)}...${analysis.address.slice(-8)}`, icon: 'location_on', gradient: 'linear-gradient(45deg, #2563eb, #0891b2)' },
                        { label: 'Confidence', value: isEmptyWallet ? 'N/A' : `${(analysis.confidence * 100).toFixed(1)}%`, icon: 'verified', gradient: 'linear-gradient(45deg, #059669, #10b981)' },
                        { label: 'Transactions', value: isEmptyWallet ? 'N/A' : (analysis.analysis_summary?.transaction_count || 0).toLocaleString(), icon: 'trending_up', gradient: 'linear-gradient(45deg, #dc2626, #ef4444)' },
                        { label: 'Balance', value: isEmptyWallet ? 'N/A' : `${(analysis.analysis_summary?.current_balance_btc || 0).toFixed(8)} BTC`, icon: 'account_balance_wallet', gradient: 'linear-gradient(45deg, #7c3aed, #a855f7)' }
                      ].map((metric, index) => (
                        <Paper
                          key={index}
                          sx={{
                            p: 3,
                            textAlign: 'center',
                            background: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(15px)',
                            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
                            borderRadius: '12px',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: `0 8px 25px ${metric.gradient.match(/#[a-fA-F0-9]{6}/)?.[0] || '#2563eb'}20`
                            }
                          }}
                        >
                          <Typography 
                            variant="h5" 
                            sx={{ 
                              fontWeight: 600, 
                              mb: 1,
                              background: metric.gradient,
                              backgroundClip: 'text',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              fontFamily: '"Inter", "Roboto", sans-serif'
                            }}
                          >
                            {metric.value}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.8rem', fontFamily: '"Inter", "Roboto", sans-serif' }}>
                            {metric.label}
                          </Typography>
                        </Paper>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Fade>
            )}

            {/* FAQ Section - Moved to Bottom */}
            {showFAQ && (
              <Fade in={showFAQ} timeout={800}>
                <Box sx={{ 
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(8px)',
                  zIndex: 1000,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  p: 2,
                  pt: { xs: 11, md: 13 }
                }}>
                  <Card sx={{ 
                    maxWidth: 800,
                    maxHeight: '90vh',
                    width: '100%',
                    background: isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)',
                    backdropFilter: 'blur(25px)',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '25px',
                    boxShadow: isDarkMode ? '0 25px 50px rgba(0, 0, 0, 0.5)' : '0 25px 50px rgba(0, 0, 0, 0.15)',
                    overflow: 'auto'
                  }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 }, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 2, md: 3 } }}>
                        <Typography variant="h5" sx={{ fontWeight: 600, fontSize: { xs: '1.25rem', md: '1.5rem' }, fontFamily: '"Inter", "Roboto", sans-serif' }}>
                          <HelpIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: { xs: '1.25rem', md: 'inherit' } }} />
                          Frequently Asked Questions
                        </Typography>
                        <Box>
                          <Button 
                            variant="outlined"
                            size="small"
                            startIcon={<AnalyticsIcon />}
                            onClick={() => setShowApproach(true)}
                            sx={{ mr: 1, textTransform: 'none', fontWeight: 600 }}
                          >
                            How we work
                          </Button>
                          <IconButton
                            onClick={() => setShowFAQ(false)}
                            sx={{
                              color: 'text.secondary',
                              '&:hover': {
                                background: 'rgba(0, 0, 0, 0.1)',
                                transform: 'scale(1.1)'
                              }
                            }}
                          >
                            <CloseIcon />
                          </IconButton>
                        </Box>
                      </Box>
                      
                      <Box sx={{ flex: 1, overflowY: 'auto', pr: 1, '&::-webkit-scrollbar': { width: '8px' }, '&::-webkit-scrollbar-track': { background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)', borderRadius: '4px' }, '&::-webkit-scrollbar-thumb': { background: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.12)', borderRadius: '4px', '&:hover': { background: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)' } } }} ref={faqContainerRef} id="faq-container">
                        {/* Dedicated How We Work section is now moved to its own modal */}
                        {[
                          {
                            question: "How does BitScan determine if a Bitcoin address is malicious?",
                            answer: [
                              "BitScan uses a sophisticated multi-layer approach combining real-world data and advanced machine learning:",
                              "• **Multiple Data Sources**: Trained on Elliptic, BitcoinHeist, Cryptocurrency Scam Database, BABD-13, and our own curated dataset",
                              "• **Advanced Feature Extraction**: We extract 20+ specialized features including transaction metrics, temporal patterns, and network indicators",
                              "• **Ensemble ML Models**: Gradient Boosting, Neural Networks, Extra Trees, and Isolation Forest algorithms working together",
                              "• **Blockchain Analysis**: Examines transaction patterns, identifies suspicious behaviors, and maps relationships between addresses",
                              "• **Advanced Risk Scoring**: Combines ML predictions, blockchain behavior, external data, and network topology into a comprehensive score",
                              "• **Real-time Validation**: Live analysis using blockchain data for current address status and recent transactions"
                            ]
                          },
                          {
                            question: "What data sources does BitScan analyze?",
                            answer: [
                              "BitScan leverages multiple authoritative datasets for maximum accuracy:",
                              "• **Elliptic Dataset**: 200K+ labeled Bitcoin transactions (licit/illicit)",
                              "• **BitcoinHeist**: Ransomware payment addresses and patterns", 
                              "• **Cryptocurrency Scam Database**: Known fraudulent wallet addresses",
                              "• **BABD-13**: Bitcoin Address Behavior Dataset with transaction patterns",
                              "• **Suspicious Bitcoin Wallets**: Curated list of fraudulent activities",
                              "• **Live Blockchain Data**: Real-time transaction history and current balance"
                            ]
                          },
                          {
                            question: "What makes an address 'high risk' vs 'low risk'?",
                            answer: [
                              "Risk levels are determined by analyzing multiple behavioral patterns:",
                              "• **HIGH RISK (70-100%)**: Known scam addresses, ransomware payments, mixing services, rapid fund movements",
                              "• **MEDIUM RISK (40-69%)**: Unusual transaction patterns, connections to flagged addresses, suspicious timing",
                              "• **LOW RISK (20-39%)**: Normal transaction patterns but some minor anomalies detected",
                              "• **MINIMAL RISK (0-19%)**: Standard wallet behavior, legitimate transaction patterns, no red flags",
                              "• **Confidence Score**: Indicates how certain the model is about its prediction"
                            ]
                          },
                          {
                            question: "How accurate are BitScan's predictions?",
                            answer: [
                              "BitScan achieves high accuracy through advanced machine learning:",
                              "• **Ensemble Approach**: Multiple models vote on final prediction for improved accuracy",
                              "• **Real-world Training**: Models trained on actual fraud cases, not synthetic data",
                              "• **Continuous Learning**: Performance metrics tracked using F1-score and ROC-AUC",
                              "• **Feature Engineering**: 50+ transaction features analyzed per address",
                              "• **Cross-validation**: Models tested against holdout datasets to prevent overfitting",
                              "• **Conservative Approach**: When uncertain, the system errs on the side of caution"
                            ]
                          },
                          {
                            question: "What should I do if my address shows high risk?",
                            answer: [
                              "If your legitimate address shows high risk, consider these factors:",
                              "• **False Positives**: No system is 100% perfect; legitimate addresses can occasionally trigger alerts",
                              "• **Recent Activity**: Check if you've received funds from flagged addresses",
                              "• **Transaction Patterns**: Unusual activity patterns might trigger automated detection",
                              "• **Contact Support**: If you believe there's an error, contact your exchange or service provider",
                              "• **Documentation**: Keep records of legitimate transactions for verification",
                              "• **Monitoring**: Re-scan periodically as risk scores can change with new transaction data"
                            ]
                          },
                          {
                            question: "Does BitScan store my wallet information?",
                            answer: [
                              "BitScan prioritizes user privacy and security:",
                              "• **No Personal Data**: Only analyzes publicly available blockchain information",
                              "• **Local Storage**: Scan history stored locally in your browser only",
                              "• **No Account Required**: No registration or personal information needed",
                              "• **Temporary Analysis**: Server doesn't permanently store individual queries",
                              "• **Public Blockchain**: All analyzed data is already public on the Bitcoin network",
                              "• **Clear History**: You can clear your local scan history anytime"
                            ]
                          }
                        ].map((faq, index) => (
                          <Accordion 
                            key={index}
                            id={`faq-item-${index}`}
                            expanded={expandedFAQ === index}
                            onChange={( isExpanded) => setExpandedFAQ(isExpanded ? index : false)}
                            sx={{
                              mb: 2,
                              background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.9)',
                              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                              borderRadius: '12px !important',
                              '&:before': { display: 'none' },
                              boxShadow: 'none'
                            }}
                          >
                            <AccordionSummary 
                              expandIcon={<ExpandMoreIcon />}
                              sx={{
                                '& .MuiAccordionSummary-content': {
                                  margin: '16px 0'
                                }
                              }}
                            >
                              <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: '"Inter", "Roboto", sans-serif' }}>
                                {faq.question}
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              <Box sx={{ pt: 1 }}>
                                {faq.answer.map((line, lineIndex) => (
                                  <Typography 
                                    key={lineIndex}
                                    variant="body1" 
                                    sx={{ 
                                      mb: 1,
                                      fontFamily: '"Inter", "Roboto", sans-serif',
                                      lineHeight: 1.6,
                                      '& strong': {
                                        fontWeight: 600,
                                        color: '#60a5fa'
                                      }
                                    }}
                                    dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
                                  />
                                ))}
                              </Box>
                            </AccordionDetails>
                          </Accordion>
                        ))}
                        
                        <Divider sx={{ my: 3 }} />
                        
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: '"Inter", "Roboto", sans-serif' }}>
                            Pro Tip: For the most accurate results, ensure the Bitcoin address is correctly formatted and currently active on the network.
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              </Fade>
            )}
     </Container>
        </PageWrapper>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
