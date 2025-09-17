import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, TextField, Button, MenuItem, useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

/* -------- validation schema (Yup) -------- */
const schema = yup.object().shape({
  firstName:   yup.string().required('First name is required'),
  lastName:    yup.string().required('Last name is required'),
  email:       yup.string().email('Enter a valid email').required('Email is required'),
  phone:       yup.string().required('Phone is required'),
  company:     yup.string().required('Company is required'),
  industry:    yup.string().required('Industry is required'),
  siteCount:   yup.string().required('Please pick a range'),
  hazardFocus: yup.string().required('Pick one'),
  timeline:    yup.string().required('Timeline is required')
});

function DemoRequestModal({ open, onClose }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const { control, handleSubmit, reset } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: '', lastName: '', email: '', phone: '',
      company: '', industry: '', siteCount: '',
      hazardFocus: '', timeline: ''
    }
  });

  /* -------- submit -------- */
  const onSubmit = async (data) => {
    try {
      await fetch('/api/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      reset();
      onClose();
      // TODO: show snackbar success
    } catch (err) {
      console.error(err);
      // TODO: snackbar error
    }
  };

  /* -------- helper to render a <Controller> wrapper -------- */
  const renderField = (name, label, extraProps = {}) => (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          label={label}
          fullWidth
          error={!!fieldState.error}
          helperText={fieldState.error?.message}
          {...extraProps}
        />
      )}
    />
  );

  return (
    <Dialog open={open} onClose={onClose} fullScreen={fullScreen} maxWidth="sm" fullWidth>
      <DialogTitle>Book a Demo</DialogTitle>

      <DialogContent dividers>
        <form id="demoRequestForm" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>{renderField('firstName', 'First Name*')}</Grid>
            <Grid item xs={12} sm={6}>{renderField('lastName', 'Last Name*')}</Grid>

            <Grid item xs={12}>{renderField('email', 'Work Email*', { type: 'email' })}</Grid>
            <Grid item xs={12}>{renderField('phone', 'Phone Number*')}</Grid>
            <Grid item xs={12}>{renderField('company', 'Company Name*')}</Grid>

            {/* -------- select fields -------- */}
            <Grid item xs={12}>
              {renderField('industry', 'Industry*', {
                select: true,
                children: ['Automotive', '3PL / Warehouse', 'Food & Beverage', 'Chemicals', 'Pharma', 'Other']
                  .map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)
              })}
            </Grid>

            <Grid item xs={12}>
              {renderField('siteCount', 'Number of Sites*', {
                select: true,
                children: ['1', '2-5', '6-15', '16-50', '50+']
                  .map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)
              })}
            </Grid>

            <Grid item xs={12}>
              {renderField('hazardFocus', 'Primary Hazard to Solve*', {
                select: true,
                children: ['Forklift Safety', 'Lockout / Tagout', 'PPE', 'Confined Space', 'Other']
                  .map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)
              })}
            </Grid>

            <Grid item xs={12}>
              {renderField('timeline', 'Implementation Timeline*', {
                select: true,
                children: ['ASAP', '1-3 months', '3-6 months', '6+ months']
                  .map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)
              })}
            </Grid>
          </Grid>
        </form>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button variant="text" onClick={onClose}>Cancel</Button>
        <Button variant="contained" type="submit" form="demoRequestForm">Submit</Button>
      </DialogActions>
    </Dialog>
  );
}

export default DemoRequestModal;
