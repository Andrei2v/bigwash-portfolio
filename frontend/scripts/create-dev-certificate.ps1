param(
    [Parameter(Mandatory = $true)][string]$LanAddress,
    [Parameter(Mandatory = $true)][string]$OutputDirectory
)

$ErrorActionPreference = 'Stop'
$certificateDirectory = [IO.Path]::GetFullPath($OutputDirectory)
[IO.Directory]::CreateDirectory($certificateDirectory) | Out-Null

# Keep private DEV keys local to the current Windows user; no trust store is modified.
$identity = [Security.Principal.WindowsIdentity]::GetCurrent().User
$permissions = New-Object Security.AccessControl.DirectorySecurity
$permissions.SetAccessRuleProtection($true, $false)
$permissions.SetOwner($identity)
$rule = New-Object Security.AccessControl.FileSystemAccessRule($identity, 'FullControl', 'ContainerInherit,ObjectInherit', 'None', 'Allow')
$permissions.AddAccessRule($rule)
Set-Acl -LiteralPath $certificateDirectory -AclObject $permissions

function Write-NewFile([string]$Name, [byte[]]$Bytes) {
    $file = [IO.File]::Open([IO.Path]::Combine($certificateDirectory, $Name), [IO.FileMode]::CreateNew)
    try { $file.Write($Bytes, 0, $Bytes.Length) }
    finally { $file.Dispose() }
}

$caKey = [Security.Cryptography.RSACng]::new(3072)
$serverKey = [Security.Cryptography.RSACng]::new(2048)
$ca = $null
$issued = $null
$serverCertificate = $null
try {
    # Unnamed CNG keys are ephemeral; the CA private key is never exported.
    $hash = [Security.Cryptography.HashAlgorithmName]::SHA256
    $padding = [Security.Cryptography.RSASignaturePadding]::Pkcs1
    $caRequest = [Security.Cryptography.X509Certificates.CertificateRequest]::new('CN=BigWash DEV local CA', $caKey, $hash, $padding)
    $caRequest.CertificateExtensions.Add([Security.Cryptography.X509Certificates.X509BasicConstraintsExtension]::new($true, $false, 0, $true))
    $caUsage = [Security.Cryptography.X509Certificates.X509KeyUsageFlags]::KeyCertSign -bor [Security.Cryptography.X509Certificates.X509KeyUsageFlags]::CrlSign
    $caRequest.CertificateExtensions.Add([Security.Cryptography.X509Certificates.X509KeyUsageExtension]::new($caUsage, $true))
    $caRequest.CertificateExtensions.Add([Security.Cryptography.X509Certificates.X509SubjectKeyIdentifierExtension]::new($caRequest.PublicKey, $false))
    $start = [DateTimeOffset]::UtcNow.AddMinutes(-5)
    $ca = $caRequest.CreateSelfSigned($start, $start.AddYears(2))

    $request = [Security.Cryptography.X509Certificates.CertificateRequest]::new('CN=BigWash DEV', $serverKey, $hash, $padding)
    $request.CertificateExtensions.Add([Security.Cryptography.X509Certificates.X509BasicConstraintsExtension]::new($false, $false, 0, $true))
    $usage = [Security.Cryptography.X509Certificates.X509KeyUsageFlags]::DigitalSignature -bor [Security.Cryptography.X509Certificates.X509KeyUsageFlags]::KeyEncipherment
    $request.CertificateExtensions.Add([Security.Cryptography.X509Certificates.X509KeyUsageExtension]::new($usage, $true))
    $purposes = [Security.Cryptography.OidCollection]::new()
    $purposes.Add([Security.Cryptography.Oid]::new('1.3.6.1.5.5.7.3.1')) | Out-Null
    $request.CertificateExtensions.Add([Security.Cryptography.X509Certificates.X509EnhancedKeyUsageExtension]::new($purposes, $false))
    $names = [Security.Cryptography.X509Certificates.SubjectAlternativeNameBuilder]::new()
    $names.AddIpAddress([Net.IPAddress]::Parse($LanAddress))
    $names.AddIpAddress([Net.IPAddress]::Loopback)
    $names.AddDnsName('localhost')
    $request.CertificateExtensions.Add($names.Build())
    $serial = New-Object byte[] 16
    $random = [Security.Cryptography.RandomNumberGenerator]::Create()
    try { $random.GetBytes($serial) } finally { $random.Dispose() }
    $serial[0] = $serial[0] -band 0x7f
    $issued = $request.Create($ca, $start, $start.AddYears(1), $serial)
    $serverCertificate = [Security.Cryptography.X509Certificates.RSACertificateExtensions]::CopyWithPrivateKey($issued, $serverKey)
    Write-NewFile 'rootCA.cer' $ca.Export([Security.Cryptography.X509Certificates.X509ContentType]::Cert)
    Write-NewFile 'server.cer' $serverCertificate.Export([Security.Cryptography.X509Certificates.X509ContentType]::Cert)
    Write-NewFile 'server.pfx' $serverCertificate.Export([Security.Cryptography.X509Certificates.X509ContentType]::Pkcs12, '')
} finally {
    if ($serverCertificate) { $serverCertificate.Dispose() }
    if ($issued) { $issued.Dispose() }
    if ($ca) { $ca.Dispose() }
    $serverKey.Dispose()
    $caKey.Dispose()
}
