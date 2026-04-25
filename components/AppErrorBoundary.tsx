import { Button } from '@/components/Button';
import { Colors, Shapes, Spacing, Typography } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
}

interface AppErrorBoundaryState {
  error: Error | null;
  retryKey: number;
}

function ErrorFallback({
  onReset,
}: {
  onReset: () => void;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Something broke</Text>
        <Text style={styles.title}>Kaarma hit an unexpected screen error.</Text>
        <Text style={styles.message}>
          We can remount the app shell and try again without leaving the session.
        </Text>
        <Button label="Try Again" onPress={onReset} fullWidth />
      </View>
    </View>
  );
}

export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    error: null,
    retryKey: 0,
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      error,
      retryKey: 0,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Unhandled render error in app shell', error, errorInfo);
  }

  handleReset = () => {
    this.setState((current) => ({
      error: null,
      retryKey: current.retryKey + 1,
    }));
    this.props.onReset?.();
  };

  render() {
    if (this.state.error) {
      return <ErrorFallback onReset={this.handleReset} />;
    }

    return <React.Fragment key={this.state.retryKey}>{this.props.children}</React.Fragment>;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.Background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.screenH,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: Shapes.Card,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    backgroundColor: Colors.Surface,
    padding: Spacing.lg,
  },
  eyebrow: {
    ...Typography.Caption,
    color: Colors.Danger,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  title: {
    ...Typography.Headline2,
    color: Colors.TextPrimary,
    marginBottom: Spacing.xs,
  },
  message: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    marginBottom: Spacing.lg,
  },
});

export default AppErrorBoundary;
