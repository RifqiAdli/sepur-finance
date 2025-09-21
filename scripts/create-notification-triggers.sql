-- Create function to generate notifications for overdue invoices
CREATE OR REPLACE FUNCTION check_overdue_invoices()
RETURNS void AS $$
DECLARE
    invoice_record RECORD;
    user_prefs RECORD;
BEGIN
    -- Check for overdue invoices
    FOR invoice_record IN 
        SELECT i.*, c.name as client_name, i.created_by as user_id
        FROM invoices i
        JOIN clients c ON i.client_id = c.id
        WHERE i.due_date < CURRENT_DATE 
        AND i.status != 'paid'
        AND i.status != 'cancelled'
    LOOP
        -- Check if user wants overdue notifications
        SELECT * INTO user_prefs 
        FROM notification_preferences 
        WHERE user_id = invoice_record.user_id;
        
        IF user_prefs.overdue_invoices OR user_prefs IS NULL THEN
            -- Check if notification already exists for this invoice
            IF NOT EXISTS (
                SELECT 1 FROM notifications 
                WHERE user_id = invoice_record.user_id 
                AND type = 'overdue_invoice'
                AND (data->>'invoice_id')::uuid = invoice_record.id
                AND created_at > CURRENT_DATE
            ) THEN
                INSERT INTO notifications (user_id, type, title, message, data)
                VALUES (
                    invoice_record.user_id,
                    'overdue_invoice',
                    'Invoice Overdue',
                    'Invoice ' || invoice_record.invoice_number || ' for ' || invoice_record.client_name || ' is overdue.',
                    json_build_object('invoice_id', invoice_record.id, 'days_overdue', CURRENT_DATE - invoice_record.due_date)
                );
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate payment received notifications
CREATE OR REPLACE FUNCTION notify_payment_received()
RETURNS TRIGGER AS $$
DECLARE
    invoice_record RECORD;
    user_prefs RECORD;
BEGIN
    -- Get invoice details
    SELECT i.*, c.name as client_name 
    INTO invoice_record
    FROM invoices i
    JOIN clients c ON i.client_id = c.id
    WHERE i.id = NEW.invoice_id;
    
    -- Check user preferences
    SELECT * INTO user_prefs 
    FROM notification_preferences 
    WHERE user_id = invoice_record.created_by;
    
    IF user_prefs.payment_received OR user_prefs IS NULL THEN
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (
            invoice_record.created_by,
            'payment_received',
            'Payment Received',
            'Payment of ' || NEW.amount || ' received for Invoice ' || invoice_record.invoice_number,
            json_build_object('payment_id', NEW.id, 'invoice_id', NEW.invoice_id, 'amount', NEW.amount)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment notifications
DROP TRIGGER IF EXISTS payment_received_notification ON payments;
CREATE TRIGGER payment_received_notification
    AFTER INSERT ON payments
    FOR EACH ROW
    EXECUTE FUNCTION notify_payment_received();

-- Create function to generate invoice created notifications
CREATE OR REPLACE FUNCTION notify_invoice_created()
RETURNS TRIGGER AS $$
DECLARE
    client_record RECORD;
    user_prefs RECORD;
BEGIN
    -- Get client details
    SELECT * INTO client_record FROM clients WHERE id = NEW.client_id;
    
    -- Check user preferences
    SELECT * INTO user_prefs 
    FROM notification_preferences 
    WHERE user_id = NEW.created_by;
    
    IF user_prefs.invoice_created OR user_prefs IS NULL THEN
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (
            NEW.created_by,
            'invoice_created',
            'New Invoice Created',
            'Invoice ' || NEW.invoice_number || ' has been created for ' || client_record.name,
            json_build_object('invoice_id', NEW.id)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for invoice notifications
DROP TRIGGER IF EXISTS invoice_created_notification ON invoices;
CREATE TRIGGER invoice_created_notification
    AFTER INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION notify_invoice_created();
