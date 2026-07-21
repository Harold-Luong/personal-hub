export function TextField({ id, label, error, hint, ...props }) {
    return (<label className={`qr-field${error ? " has-error" : ""}`} htmlFor={id}>
            <span>{label}</span>
            <input aria-describedby={error ? `${id}-error` : undefined} aria-invalid={Boolean(error)} id={id} {...props}/>
            {hint && !error ? <small>{hint}</small> : null}
            {error ? <small className="qr-field__error" id={`${id}-error`}>{error}</small> : null}
        </label>);
}
export function TextAreaField({ id, label, error, hint, ...props }) {
    return (<label className={`qr-field${error ? " has-error" : ""}`} htmlFor={id}>
            <span>{label}</span>
            <textarea aria-describedby={error ? `${id}-error` : undefined} aria-invalid={Boolean(error)} id={id} {...props}/>
            {hint && !error ? <small>{hint}</small> : null}
            {error ? <small className="qr-field__error" id={`${id}-error`}>{error}</small> : null}
        </label>);
}
export function SelectField({ id, label, error, children, ...props }) {
    return (<label className={`qr-field${error ? " has-error" : ""}`} htmlFor={id}>
            <span>{label}</span>
            <select aria-invalid={Boolean(error)} id={id} {...props}>{children}</select>
            {error ? <small className="qr-field__error">{error}</small> : null}
        </label>);
}
export function ToggleField({ checked, children, id, onChange }) {
    return (<label className="qr-toggle" htmlFor={id}>
            <input checked={checked} id={id} onChange={(event) => onChange(event.target.checked)} type="checkbox"/>
            <span aria-hidden="true"/>
            {children}
        </label>);
}
