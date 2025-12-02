import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  FormControlLabel,
  Checkbox,
  Typography,
} from '@mui/material';

import Grid from '@mui/material/Grid';

export interface PrescriptionMedication {
  name: string;
  dosage: string;
  morning: boolean;
  night: boolean;
}

export interface Prescription {
  medications: PrescriptionMedication[];
  notes?: string;
}

interface PrescriptionDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (prescription: Prescription) => void;
}

const createEmptyMedication = (): PrescriptionMedication => ({
  name: '',
  dosage: '',
  morning: true,
  night: false,
});

const PrescriptionDialog: React.FC<PrescriptionDialogProps> = ({ open, onClose, onSubmit }) => {
  const [medications, setMedications] = useState<PrescriptionMedication[]>([createEmptyMedication()]);
  const [notes, setNotes] = useState('');

  const handleMedicationChange = (index: number, field: keyof PrescriptionMedication, value: string | boolean) => {
    setMedications(prev =>
      prev.map((med, i) => (i === index ? { ...med, [field]: value } : med))
    );
  };

  const handleAddMedication = () => {
    setMedications(prev => [...prev, createEmptyMedication()]);
  };

  const handleRemoveMedication = (index: number) => {
    setMedications(prev => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  const handleSubmit = () => {
    const cleaned = medications.filter(m => m.name.trim() !== '');
    if (cleaned.length === 0) {
      return;
    }
    onSubmit({ medications: cleaned, notes: notes.trim() });
    setMedications([createEmptyMedication()]);
    setNotes('');
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Create Prescription</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          {medications.map((med, index) => (
            <Box
              key={index}
              sx={{
                mb: 2,
                p: 1.5,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Grid container spacing={1} alignItems="center">
                <Grid item xs={12} sm={5}>
                  <TextField
                    fullWidth
                    label="Medicine"
                    value={med.name}
                    onChange={e => handleMedicationChange(index, 'name', e.target.value)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Dosage"
                    placeholder="1 tablet"
                    value={med.dosage}
                    onChange={e => handleMedicationChange(index, 'dosage', e.target.value)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={med.morning}
                          onChange={e => handleMedicationChange(index, 'morning', e.target.checked)}
                        />
                      }
                      label="Day"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={med.night}
                          onChange={e => handleMedicationChange(index, 'night', e.target.checked)}
                        />
                      }
                      label="Night"
                    />
                  </Box>
                </Grid>
              </Grid>
              {medications.length > 1 && (
                <Box sx={{ mt: 1, textAlign: 'right' }}>
                  <Button size="small" color="error" onClick={() => handleRemoveMedication(index)}>
                    Remove
                  </Button>
                </Box>
              )}
            </Box>
          ))}

          <Button variant="outlined" size="small" onClick={handleAddMedication} sx={{ mb: 2 }}>
            Add medicine
          </Button>

          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Notes / Instructions"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />

          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            This prescription will be sent as a formatted card in the chat.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Send to patient
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PrescriptionDialog;
