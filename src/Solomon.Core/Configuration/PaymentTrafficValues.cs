namespace Solomon.Core.Configuration;

public static class PaymentTrafficValues
{
    public const string Domestic = "domestic";
    public const string Foreign = "foreign";

    public static bool IsValid(string? value) =>
        string.Equals(value, Domestic, StringComparison.OrdinalIgnoreCase)
        || string.Equals(value, Foreign, StringComparison.OrdinalIgnoreCase);

    public static string Normalize(string? value) =>
        string.Equals(value, Foreign, StringComparison.OrdinalIgnoreCase) ? Foreign : Domestic;
}

public static class FilePrefixDefaults
{
    public const string Domestic = "NA_";
    public const string Foreign = "NT_";

    public static string ForPaymentTraffic(string paymentTraffic) =>
        PaymentTrafficValues.Normalize(paymentTraffic) == PaymentTrafficValues.Foreign
            ? Foreign
            : Domestic;
}
